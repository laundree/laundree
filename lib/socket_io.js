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
  if (!opbeat) return socket.on(event, action)
  socket.on(event, function () {
    const trans = opbeat.startTransaction(`WS ${event}`, 'web.websocket')
    action.apply(this, arguments)
      .catch(error.logError)
      .then(() => trans.end())
  })
}

function emitResult (socket, promise, action) {
  return promise.then(result => socket.emit('action', action(result)))
}

function fetchLaundryGenerator (currentUserId, fn) {
  return laundryId => fetchLaundry(currentUserId, laundryId).then(laundry => {
    if (!laundry) return
    fn(laundry)
  })
}

function setupRooms (io) {
  UserHandler.redux.on('action', ({id, action}) => {
    debug(`Got redux action for user: ${id}`)
    io.to(`user.${id}`).emit('action', action)
  })

  const handlers = [UserHandler, LaundryHandler, LaundryInvitationHandler, MachineHandler, BookingHandler]
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

function setupFunctions (socket, currentUserId) {
  socketOn(socket, 'listBookingsInTime', (laundryId, from, to) =>
    fetchLaundry(currentUserId, laundryId)
      .then((laundry) => {
        if (!laundry) return
        debug('Emitting list bookings (in time)')
        return laundry.fetchBookings(new Date(from), new Date(to)).then((bookings) => socket.emit('action', actions.listBookings(bookings)))
      }))

  socketOn(socket, 'listBookingsForUser', (laundryId, userId, filter) =>
    fetchLaundry(currentUserId, laundryId)
      .then((laundry) => {
        if (!laundry) return
        debug('Emitting list bookings')
        return BookingHandler
          .find(Object.assign({}, filter, {machine: {$in: laundry.model.machines}, owner: userId}), {
            sort: {
              from: 1,
              to: 1
            }
          })
          .then((bookings) => socket.emit('action', actions.listBookingsForUser({user: userId, bookings})))
      }))

  socketOn(socket, 'listUsersAndInvites', fetchLaundryGenerator(currentUserId, laundry => {
    debug('Emitting list users and invites')
    return Promise.all([
      emitResult(socket, laundry.fetchUsers(), actions.listUsers),
      emitResult(socket, laundry.fetchInvites(), actions.listInvites)
    ])
  }))

  socketOn(socket, 'listMachinesAndUsers', fetchLaundryGenerator(currentUserId, laundry => {
    debug('Emitting list users and machines')
    return Promise.all([
      emitResult(socket, laundry.fetchUsers(), actions.listUsers),
      emitResult(socket, laundry.fetchMachines(), actions.listMachines)
    ])
  }))

  socketOn(socket, 'listMachines', fetchLaundryGenerator(currentUserId, laundry => {
    debug('Emitting list machines')
    return emitResult(socket, laundry.fetchMachines(), actions.listMachines)
  }))
}

function setupAdminFunctions (socket) {
  debug('Adding admin functions')
  socketOn(socket, 'listLaundries', () => {
    debug('Listing laundries')
    return emitResult(socket, LaundryHandler.find(), actions.listLaundries)
  })
  socketOn(socket, 'listUsers', () => {
    debug('Listing users')
    return emitResult(socket, UserHandler.find(), actions.listUsers)
  })
  socketOn(socket, 'updateStats', () => {
    debug('Emitting stats')
    const promisedStats = Promise
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
    return emitResult(socket, promisedStats, actions.updateStats)
  })
}

function setupRedux (io) {
  setupRooms(io)
  const userUpdateEmitter = new EventEmitter()
  UserHandler.on('update', user => userUpdateEmitter.emit(user.model.id, user))
  io.on('connect', socket => {
    debug('Connecting socket')
    const currentUserId = socket.request.session.passport ? socket.request.session.passport.user : undefined
    UserHandler.findFromId(currentUserId).then((user) => setupUser(socket, userUpdateEmitter, user))
  })
}

function setupUser (socket, userUpdateEmitter, user) {
  if (!user) return
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
  setupFunctions(socket, user.model.id)
  if (user.isAdmin) setupAdminFunctions(socket)
  socket.on('disconnect', () => {
    debug('Disconnecting')
    userUpdateEmitter.removeListener(user.model.id, listener)
  })
}

module.exports = setupSocket
