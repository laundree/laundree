// @flow
import socketIo from 'socket.io'
import session from './session'
import UserHandler from '../handlers/user'
import LaundryHandler from '../handlers/laundry'
import MachineHandler from '../handlers/machine'
import BookingHandler from '../handlers/booking'
import LaundryInvitationHandler from '../handlers/laundry_invitation'
import * as error from '../utils/error'
import Debug from 'debug'
import { opbeat } from '../lib/opbeat'
import EventEmitter from 'events'
import type {Action, ListInvitationsAction, ListLaundriesAction, ListUsersAction, ListMachinesAction, ListBookingsAction} from 'laundree-sdk/lib/redux'

const debug = Debug('laundree.lib.socket_io')
/**
 * Set up the socket with provided namespaces.
 * @param {Agent} server
 */
function setupSocket (server: Server) {
  const io = socketIo(server)
  io.use((socket, next) => session(socket.request, socket.request.res, next))
  setupRedux(io.of('/redux'))
}

function fetchLaundry (currentUserId, laundryId) {
  debug('Fetching laundry', currentUserId, laundryId)
  return UserHandler
    .lib
    .findFromId(currentUserId)
    .then(user => {
      const filter: { _id: *, users?: * } = {_id: laundryId}
      if (!user.isAdmin()) filter.users = user.model._id // If not admin user restrict available laundries
      return LaundryHandler.lib.find(filter)
    })
    .then(([laundry]) => laundry)
}

const mockTransaction = {
  end: () => {
  }
}

function socketOn (socket, event, action) {
  socket.on(event, function () {
    const trans = opbeat ? opbeat.startTransaction(`WS ${event}`, 'web.websocket') : mockTransaction
    action.apply(undefined, arguments)
      .catch(error.logError)
      .then(() => trans.end())
  })
}

function defineSocketFunction (socket, event, action: (arg: any) => Promise<Action[]>) {
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
function emitActions (socket, acts: Action[], jobId) {
  const actArray = Array.isArray(acts) ? acts : [acts]
  if (!jobId) return socket.emit('actions', actArray)
  return emitActions(socket, actArray.concat({type: 'FINISH_JOB', payload: jobId}))
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
  UserHandler.lib.redux.on('action', ({id, laundries, action}) => {
    debug(`Got redux action for user: ${id}`)
    emitActions(io.to(`user.${id}`), action)
    laundries.forEach(id => emitActions(io.to(`laundry.${id}`), action))
  })

  const handlers = [LaundryHandler, LaundryInvitationHandler, MachineHandler, BookingHandler]
  handlers.forEach(_Handler => {
    debug(`Listening on ${_Handler.name}`)
    _Handler.lib.redux.on('action', ({laundries, action}) => {
      debug(`Got redux action for laundries: ${laundries.join(', ')}`)
      if (!laundries.length) return emitActions(io, action)
      laundries.forEach(id => emitActions(io.to(`laundry.${id}`), action))
    })
  })
}

function userToRooms (user) {
  const laundries = user.model.laundries
  return [`user.${user.model.id}`].concat(laundries.map(id => `laundry.${id.toString()}`))
}

function errorLogger (err) {
  if (!err) return
  error.logError(err)
}

function setupFunctions (socket) {
  defineLaundrySocketFunction(
    socket,
    'listBookingsInTime',
    (laundry, from, to) => laundry.fetchBookings(from, to).then(actionListBookings))

  defineLaundrySocketFunction(
    socket,
    'listBookingsForUser',
    (laundry, userId, filter) =>
      BookingHandler
        .lib
        .find(Object.assign({}, filter,
          {machine: {$in: laundry.model.machines}, owner: userId}),
          {sort: {from: 1, to: 1}})
        .then(bookings => ({
          type: 'LIST_BOOKINGS_FOR_USER',
          payload: {user: userId, bookings: bookings.map((b: BookingHandler) => b.reduxModel())}
        })))

  defineLaundrySocketFunction(socket, 'listUsersAndInvites',
    laundry => Promise.all([
      laundry.fetchUsers().then(actionListUsers),
      laundry.fetchInvites().then(actionsListInvites)
    ]))

  defineLaundrySocketFunction(socket, 'listMachinesAndUsers',
    laundry => Promise.all([
      laundry.fetchUsers().then(actionListUsers),
      laundry.fetchMachines().then(actionListMachines)
    ])
  )
  defineLaundrySocketFunction(socket, 'listMachines',
    laundry => laundry.fetchMachines().then(actionListMachines))

  defineLaundrySocketFunction(
    socket,
    'fetchLaundry',
    laundry => actionListLaundries([laundry]))
}

function find (_Handler, options, fields = []) {
  debug('Finding with options', options)
  const filter = {}
  if (options && options.q && fields.length) {
    filter.$or = fields
      .map(field => {
        const obj = {}
        obj[field] = new RegExp(options.q, 'i')
        return obj
      })
  }
  if (options && !options.showDemo) {
    filter.demo = {$ne: true}
  }
  debug('Using filter', filter)
  const opts = options ? {limit: options.limit, skip: options.skip, sort: {_id: 1}} : undefined
  return Promise.all([_Handler.lib.find(filter, opts), _Handler.lib.fetchCount(filter)])
}

function setupAdminFunctions (socket) {
  debug('Adding admin functions')
  defineSocketFunction(
    socket,
    'listLaundries',
    options => find(LaundryHandler, options, ['name'])
      .then(([laundries, size]) => [actionListLaundries(laundries)]))

  defineSocketFunction(
    socket,
    'fetchUser',
    userId => Promise
      .all([UserHandler.lib.findFromId(userId), LaundryHandler.lib.find({users: userId})])
      .then(([user, laundries]) => [actionListUsers([user]), actionListLaundries(laundries)]))

  defineSocketFunction(
    socket,
    'listUsers',
    options => find(UserHandler, options, ['profiles.displayName', 'profiles.emails.value'])
      .then(([users, size]) => [actionListUsers(users)]))

  defineSocketFunction(
    socket,
    'updateStats',
    () => Promise
      .all([
        LaundryHandler.lib.fetchCount(),
        LaundryHandler.lib.fetchCount({demo: true}),
        UserHandler.lib.fetchCount(),
        UserHandler.lib.fetchCount({demo: true}),
        BookingHandler.lib.fetchCount(),
        MachineHandler.lib.fetchCount()
      ])
      .then(([
               laundryCount,
               demoLaundryCount,
               userCount,
               demoUserCount,
               bookingCount,
               machineCount
             ]) => [{
        type: 'UPDATE_STATS',
        payload: {
          demoLaundryCount,
          demoUserCount,
          laundryCount,
          userCount,
          bookingCount,
          machineCount
        }
      }])
  )
}

function authenticateSocket (socket): Promise<?UserHandler> {
  debug('Authenticating user')
  const {userId, token} = socket.handshake.query || {} // Authenticate token from query
  if (userId && token) {
    debug('Got userId and token', userId, token)
    return UserHandler
      .lib
      .findFromIdWithTokenSecret(userId, token)
      .then(({user, token}) => {
        if (!user || !token) {
          debug('Authentication failed')
          return
        }
        token.seen()
        debug('Authentication successful')
        return user
      })
  }
  const currentUserId = socket.request.session.passport ? socket.request.session.passport.user : undefined // Authenticate from session
  if (!currentUserId) return Promise.resolve()
  return UserHandler.lib.findFromId(currentUserId)
}

function setupRedux (io) {
  setupRooms(io)
  const userUpdateEmitter = new EventEmitter()
  UserHandler.lib.on('update', user => userUpdateEmitter.emit(user.model.id, user))
  io.on('connect', socket => {
    debug('Connecting socket')
    authenticateSocket(socket)
      .then(user => setupUser(socket, userUpdateEmitter, user))
  })
}

function actionListLaundries (laundries: LaundryHandler[]): ListLaundriesAction {
  return {type: 'LIST_LAUNDRIES', payload: laundries.map(l => l.reduxModel())}
}
function actionListUsers (users: UserHandler[]): ListUsersAction {
  return {type: 'LIST_USERS', payload: users.map(l => l.reduxModel())}
}
function actionListMachines (machines: MachineHandler[]): ListMachinesAction {
  return {type: 'LIST_MACHINES', payload: machines.map(l => l.reduxModel())}
}
function actionListBookings (machines: BookingHandler[]): ListBookingsAction {
  return {type: 'LIST_BOOKINGS', payload: machines.map(l => l.reduxModel())}
}
function actionsListInvites (machines: LaundryInvitationHandler[]): ListInvitationsAction {
  return {type: 'LIST_INVITATIONS', payload: machines.map(l => l.reduxModel())}
}

function setupUser (socket, userUpdateEmitter, u: ?UserHandler) {
  const user = u
  if (!user) return
  socket.currentUserId = user.model.id
  let rooms = userToRooms(user)
  const listener = (user) => {
    let newRooms = userToRooms(user)
    let oldRoomsSet = new Set(rooms)
    let newRoomsSet = new Set(newRooms)
    let toBeRemoved = rooms.filter(room => !newRoomsSet.has(room))
    let toBeAdded = newRooms.filter(room => !oldRoomsSet.has(room))
    debug(`Joining room(s): ${toBeAdded.join(', ')}`)
    toBeAdded.forEach(room => socket.join(room, (err) => {
      if (err) errorLogger(err)
      debug(`Leaving room(s): ${toBeRemoved.join(', ')}`)
      toBeRemoved.forEach(room => socket.leave(room, errorLogger))
    }))
    rooms = newRooms
  }
  userUpdateEmitter.on(user.model.id, listener)
  debug(`Joining room(s): ${rooms.join(', ')}`)
  rooms.forEach(room => socket.join(room, errorLogger))
  setupFunctions(socket)
  if (user.isAdmin()) setupAdminFunctions(socket)
  socket.emit('ready')
  user.fetchLaundries()
    .then(laundries => [
      actionListLaundries(laundries),
      {type: 'SIGN_IN_USER', payload: user.reduxModel()}
    ])
    .then(actions => emitActions(socket, actions))

  socket.on('disconnect', () => {
    debug('Disconnecting')
    userUpdateEmitter.removeListener(user.model.id, listener)
  })
}

export default setupSocket
