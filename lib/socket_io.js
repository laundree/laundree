const socketIo = require('socket.io')
const session = require('./session')
const {UserHandler, LaundryHandler, MachineHandler, BookingHandler, LaundryInvitationHandler} = require('../handlers')
const {actions} = require('../redux')
const {error} = require('../utils')
const debug = require('debug')('laundree.lib.socket_io')
const {opbeat} = require('../lib/opbeat')
const EventEmitter = require('events')
/**
 * Set up the socket with provided namespaces.
 * @param {Agent} server
 */
function setupSocket (server) {
  const io = socketIo(server)
  io.use((socket, next) => session(socket.request, socket.request.res, next))
  setupRedux(io.of('/redux'))
}

function fetchLaundry (currentUserId, laundryId) {
  return UserHandler
    .findFromId(currentUserId)
    .then(user => {
      const filter = {_id: laundryId}
      if (!user.isAdmin) filter.users = user.model._id // If not admin user restrict available laundries
      return LaundryHandler.find(filter)
    })
    .then(([laundry]) => laundry)
}

function socketOn (socket, event, action) {
  socket.on(event, function () {
    const trans = opbeat ? opbeat.startTransaction(`WS ${event}`, 'web.websocket') : {
      end: () => {
      }
    }
    action.apply(undefined, arguments)
      .catch(error.logError)
      .then(() => trans.end())
  })
}

function defineSocketFunction (socket, event, action) {
  socketOn(socket, event, ({jobId}, ...args) => action.apply(undefined, args).then(actions => {
    actions = Array.isArray(actions) ? actions : [actions]
    return emitActions(socket, actions, jobId)
  }))
}

function defineLaundrySocketFunction (socket, event, action) {
  return defineSocketFunction(socket, event, fetchLaundryGenerator(socket.currentUserId, action))
}

/**
 * Emit an array of actions
 * @param {Socket} socket
 * @param {Object[]} acts
 * @param {int=} jobId
 */
function emitActions (socket, acts, jobId) {
  if (!jobId) return socket.emit('actions', acts)
  return emitActions(socket, acts.concat(actions.finishJob(jobId)))
}

function fetchLaundryGenerator (currentUserId, fn) {
  return (laundryId, ...args) => {
    return fetchLaundry(currentUserId, laundryId)
      .then(laundry => {
        if (!laundry) return
        return fn.apply(undefined, [laundry].concat(args))
      })
  }
}

function setupRooms (io) {
  UserHandler.redux.on('action', ({id, laundries, action}) => {
    debug(`Got redux action for user: ${id}`)
    io.to(`user.${id}`).emit('action', action)
    laundries.forEach(id => io.to(`laundry.${id}`).emit('action', action))
  })

  const handlers = [LaundryHandler, LaundryInvitationHandler, MachineHandler, BookingHandler]
  handlers.forEach(_Handler => {
    debug(`Listening on ${_Handler.name}`)
    _Handler.redux.on('action', ({laundries, action}) => {
      debug(`Got redux action for laundries: ${laundries.join(', ')}`)
      if (!laundries.length) return io.emit('action', action)
      laundries.forEach(id => io.to(`laundry.${id}`).emit('action', action))
    })
  })
}

function userToRooms (user) {
  const laundries = user.model.laundries
  return laundries.length ? laundries.map(id => `laundry.${id}`) : [`user.${user.model.id}`]
}

function errorLogger (err) {
  if (!err) return
  error.logError(err)
}

function setupFunctions (socket) {
  defineLaundrySocketFunction(
    socket,
    'listBookingsInTime',
    (laundry, from, to) => laundry.fetchBookings(from, to).then(actions.listBookings))

  defineLaundrySocketFunction(
    socket,
    'listBookingsForUser',
    (laundry, userId, filter) =>
      BookingHandler
        .find(Object.assign({}, filter,
          {machine: {$in: laundry.model.machines}, owner: userId}),
          {sort: {from: 1, to: 1}})
        .then(bookings => ({user: userId, bookings}))
        .then(actions.listBookingsForUser))

  defineLaundrySocketFunction(socket, 'listUsersAndInvites',
    laundry => Promise.all([
      laundry.fetchUsers().then(actions.listUsers),
      laundry.fetchInvites().then(actions.listInvites)
    ]))

  defineLaundrySocketFunction(socket, 'listMachinesAndUsers',
    laundry => Promise.all([
      laundry.fetchUsers().then(actions.listUsers),
      laundry.fetchMachines().then(actions.listMachines)
    ])
  )
  defineLaundrySocketFunction(socket, 'listMachines',
    laundry => laundry.fetchMachines().then(actions.listMachines))
}

function find (_Handler, options, fields = []) {
  let filter = {}
  if (options && options.q && fields.length) {
    filter = {
      $or: fields
        .map(field => {
          const obj = {}
          obj[field] = new RegExp(options.q, 'i')
          return obj
        })
    }
  }
  const opts = options ? {limit: options.limit, skip: options.skip, sort: {_id: 1}} : undefined
  return Promise.all([_Handler.find(filter, opts), _Handler.fetchCount(filter)])
}

function setupAdminFunctions (socket) {
  debug('Adding admin functions')
  defineSocketFunction(
    socket,
    'listLaundries',
    options => find(LaundryHandler, options, ['name'])
      .then(([laundries, size]) => [actions.listLaundries(laundries), actions.updateLaundryListSize(size)]))

  defineSocketFunction(
    socket,
    'listUsers',
    options => find(UserHandler, options, ['profiles.displayName', 'profiles.emails.value'])
      .then(([users, size]) => [actions.listUsers(users), actions.updateUserListSize(size)]))

  defineSocketFunction(
    socket,
    'updateStats',
    () => Promise
      .all([
        LaundryHandler.fetchCount(),
        LaundryHandler.fetchCount({demo: true}),
        UserHandler.fetchCount(),
        UserHandler.fetchCount({demo: true}),
        BookingHandler.fetchCount(),
        MachineHandler.fetchCount()
      ])
      .then(([
        laundryCount,
        demoLaundryCount,
        userCount,
        demoUserCount,
        bookingCount,
        machineCount
      ]) => ({
        demoLaundryCount,
        demoUserCount,
        laundryCount,
        userCount,
        bookingCount,
        machineCount
      }))
      .then(actions.updateStats)
  )
}

function setupRedux (io) {
  setupRooms(io)
  const userUpdateEmitter = new EventEmitter()
  UserHandler.on('update', user => userUpdateEmitter.emit(user.model.id, user))
  io.on('connect', socket => {
    debug('Connecting socket')
    const currentUserId = socket.request.session.passport ? socket.request.session.passport.user : undefined
    UserHandler
      .findFromId(currentUserId)
      .then(user => setupUser(socket, userUpdateEmitter, user))
  })
}

function setupUser (socket, userUpdateEmitter, user) {
  if (!user) return
  socket.currentUserId = user.model.id
  let rooms = userToRooms(user)
  const listener = (user) => {
    let newRooms = userToRooms(user)
    let oldRoomsSet = new Set(rooms)
    let newRoomsSet = new Set(newRooms)
    let toBeRemoved = rooms.filter(room => !newRoomsSet.has(room))
    let toBeAdded = newRooms.filter(room => !oldRoomsSet.has(room))
    debug(`Leaving room(s): ${toBeRemoved.join(', ')}`)
    toBeRemoved.forEach(room => socket.leave(room, errorLogger))
    debug(`Joining room(s): ${toBeAdded.join(', ')}`)
    toBeAdded.forEach(room => socket.join(room, errorLogger))
    rooms = newRooms
  }
  userUpdateEmitter.on(user.model.id, listener)
  debug(`Joining room(s): ${rooms.join(', ')}`)
  rooms.forEach(room => socket.join(room, errorLogger))
  setupFunctions(socket)
  if (user.isAdmin) setupAdminFunctions(socket)
  socket.on('disconnect', () => {
    debug('Disconnecting')
    userUpdateEmitter.removeListener(user.model.id, listener)
  })
}

module.exports = setupSocket
