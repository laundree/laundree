const socketIo = require('socket.io')
const redis = require('socket.io-redis')
const session = require('./session')
const config = require('config')
const {UserHandler, LaundryHandler, MachineHandler, BookingHandler, LaundryInvitationHandler} = require('../handlers')
const {createInitialEvents, actions} = require('../redux')
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
  io.adapter(redis({host: config.get('redis.host'), port: config.get('redis.port')}))
  io.use((socket, next) => session(socket.request, socket.request.res, next))
  setupRedux(io.of('/redux'))
}

function fetchLaundry (currentUserId, laundryId) {
  return UserHandler
    .findFromId(currentUserId)
    .then(user => LaundryHandler.find({_id: laundryId, users: user.model._id}))
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
  promise.then(result => socket.emit('action', action(result)))
}

function fetchLaundryGenerator (currentUserId, fn) {
  return laundryId => fetchLaundry(currentUserId, laundryId).then(laundry => {
    if (!laundry) return
    fn(laundry)
  })
}

function setupRooms (io) {
  const handlers = [UserHandler, LaundryHandler, LaundryInvitationHandler, MachineHandler, BookingHandler]
  handlers.forEach(_Handler => {
    debug(`Listening on ${_Handler.name}`)
    _Handler.redux.on('action', ({laundries, action}) => {
      debug(`Got redux action for laundries: ${laundries.join(', ')}`)
      if (!laundries.length) return io.emit('action', action)
      laundries.forEach(room => io.to(room).emit('action', action))
    })
  })
}

function userToRooms (user) {
  return user.model.laundries.map(id => id.toString())
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

}

function setupRedux (io) {
  setupRooms(io)
  const userUpdateEmitter = new EventEmitter()
  UserHandler.on('update', user => userUpdateEmitter.emit(user.model.id, user))
  io.on('connect', socket => {
    debug('Connecting socket')
    const currentUserId = socket.request.session.passport ? socket.request.session.passport.user : undefined
    UserHandler.findFromId(currentUserId).then((user) => {
      createInitialEvents(user).then((events) => socket.emit('init', events))
      if (!user) return
      var rooms = userToRooms(user)
      userUpdateEmitter.on(currentUserId, (u) => {
        debug(`Leaving room(s): ${rooms.join(', ')}`)
        rooms.forEach(room => socket.leave(room), errorLogger)
        rooms = userToRooms(u)
        debug(`Joining room(s): ${rooms.join(', ')}`)
        rooms.forEach(room => socket.join(room, errorLogger))
      })
      debug(`Joining room(s): ${rooms.join(', ')}`)
      rooms.forEach(room => socket.join(room, errorLogger))

      setupFunctions(socket, currentUserId)

      if (user.role === 'admin') setupAdminFunctions(socket, currentUserId)

      socket.on('disconnect', () => debug('Disconnecting'))
    })
  })
}

module.exports = setupSocket
