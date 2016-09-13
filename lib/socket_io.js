const socketIo = require('socket.io')
const redis = require('socket.io-redis')
const session = require('./session')
const config = require('config')
const {UserHandler, LaundryHandler, MachineHandler, BookingHandler, LaundryInvitationHandler} = require('../handlers')
const {createInitialEvents, actions} = require('../redux')
const {error} = require('../utils')
const debug = require('debug')('laundree.lib.socket_io')
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

function fetchLaundry (socket, laundryId) {
  var currentUserId = socket.request.session.passport ? socket.request.session.passport.user : null
  return UserHandler
    .findFromId(currentUserId)
    .then(user => LaundryHandler.find({_id: laundryId, users: user.model._id}))
    .then(([laundry]) => laundry)
}

function filterGenerator (currentUserId, laundryIdFetcher) {
  return (item) => {
    if (!item.model) return Promise.resolve(true)
    return UserHandler
      .find({_id: currentUserId, laundries: laundryIdFetcher(item)})
      .then(a => a.length)
  }
}

function setupRedux (io) {
  io.on('connect', (s) => {
    debug('Connecting socket')
    var currentUserId = s.request.session.passport ? s.request.session.passport.user : undefined
    UserHandler.findFromId(currentUserId).then((user) => {
      createInitialEvents(user).then((events) => s.emit('init', events))
      if (!user) return
      var removers = []
      removers = removers.concat(UserHandler.setupSocket(s, {updateAction: actions.updateUser},
        filterGenerator(currentUserId, ({model: {laundries}}) => ({$in: laundries}))))

      removers = removers.concat(LaundryHandler.setupSocket(s, {
        updateAction: actions.updateLaundry,
        createAction: actions.createLaundry,
        deleteAction: actions.deleteLaundry
      }, filterGenerator(currentUserId, ({model: {_id}}) => _id)))

      removers = removers.concat(LaundryInvitationHandler.setupSocket(s, {
        updateAction: actions.updateInvite,
        createAction: actions.createInvite,
        deleteAction: actions.deleteInvite
      }, filterGenerator(currentUserId, ({model: {laundry}}) => laundry)))

      removers = removers.concat(MachineHandler.setupSocket(s, {
        updateAction: actions.updateMachine,
        createAction: actions.createMachine,
        deleteAction: actions.deleteMachine
      }, filterGenerator(currentUserId, ({model: {laundry}}) => laundry)))

      removers = removers.concat(BookingHandler.setupSocket(s, {
        updateAction: actions.updateBooking,
        createAction: actions.createBooking,
        deleteAction: actions.deleteBooking
      }, filterGenerator(currentUserId, ({model: {laundry}}) => laundry)))

      s.on('listBookingsInTime', (laundryId, from, to) => {
        fetchLaundry(s, laundryId)
          .then((laundry) => {
            if (!laundry) return
            debug('Emitting list bookings (in time)')
            laundry.fetchBookings(new Date(from), new Date(to)).then((bookings) => s.emit('action', actions.listBookings(bookings)))
          })
      })
      s.on('listBookingsForUser', (laundryId, userId, filter) => {
        fetchLaundry(s, laundryId)
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
              .then((bookings) => s.emit('action', actions.listBookingsForUser({user: userId, bookings})))
          })
          .catch(error.logError)
      })
      s.on('listUsers', (laundryId) => {
        fetchLaundry(s, laundryId)
          .then((laundry) => {
            if (!laundry) return
            debug('Emitting list users')
            laundry.fetchUsers().then((users) => s.emit('action', actions.listUsers(users)))
          })
      })
      s.on('listInvites', (laundryId) => {
        fetchLaundry(s, laundryId)
          .then((laundry) => {
            if (!laundry) return
            debug('Emitting list invites')
            laundry.fetchInvites().then((invites) => s.emit('action', actions.listInvites(invites)))
          })
      })
      s.on('disconnect', () => {
        debug('Disconnecting')
        removers.forEach((r) => r.remove())
      })
    })
  })
}

module.exports = setupSocket
