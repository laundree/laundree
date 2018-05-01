// @flow
import connectMongoose from '../db/mongoose'
import socketIo from 'socket.io'
import UserHandler from '../handlers/user'
import LaundryHandler from '../handlers/laundry'
import MachineHandler from '../handlers/machine'
import BookingHandler from '../handlers/booking'
import LaundryInvitationHandler from '../handlers/laundry_invitation'
import Debug from 'debug'
import EventEmitter from 'events'
import config from 'config'
import type {
  Action,
  ListInvitationsAction,
  ListLaundriesAction,
  ListUsersAction,
  ListMachinesAction,
  ListBookingsAction
} from 'laundree-sdk/lib/redux'
import { verify } from '../auth'
import type { Payload } from '../auth'
import type { DateObject } from '../handlers/laundry'
import { logError } from '../utils/error'
import { mongoDbId } from '../utils/regex'

connectMongoose()

const debug = Debug('laundree.lib.socket_io')

/**
 * Set up the socket with provided namespaces.
 * @param {Agent} server
 */
function setupSocket (server: Server) {
  const io = socketIo(server, {path: config.get('socket_io.path')})
  setupRedux(io.of('/redux'))
}

function fetchLaundry (currentUserId, laundryId: string) {
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

function socketOn (socket, event, action: (n: number, ...mixed[]) => Promise<*>) {
  socket.on(event, async (...args: mixed[]) => {
    if (!args.length) {
      return
    }
    const [firstArg, ...rest] = args
    const jobId = firstArg && typeof firstArg === 'object' && typeof firstArg.jobId === 'number' ? firstArg.jobId : null
    if (jobId === null) {
      return
    }
    const trans = mockTransaction
    try {
      await action(jobId, ...rest)
    } catch (err) {
      err.logError(err)
    } finally {
      trans.end()
    }
  })
}

type Actor = (...arg: mixed[]) => Promise<Action[]> | Action[]

function defineSocketFunction (socket, event, action: Actor) {
  socketOn(socket, event, async (jobId, ...args) => {
    let actions = []
    try {
      actions = await action.apply(undefined, args)
    } catch (err) {
      debug('Logging socket function error')
      logError(err)
    } finally {
      emitActions(socket, actions, jobId)
    }
  })
}

type LaundryActor = (l: LaundryHandler, ...mixed[]) => (Promise<Action[]> | Action[])

function defineLaundrySocketFunction (socket, event, action: LaundryActor) {
  const actor: Actor = fetchLaundryGenerator(socket.currentUserId, action)
  return defineSocketFunction(socket, event, actor)
}

/**
 * Emit an array of actions
 * @param {Socket} socket
 * @param {Object[]} acts
 * @param {int=} jobId
 */
function emitActions (socket, acts: Action[], jobId) {
  if (!jobId) return socket.emit('actions', acts)
  return emitActions(socket, acts.concat({type: 'FINISH_JOB', payload: jobId}))
}

function fetchLaundryGenerator (currentUserId: string, fn: (l: LaundryHandler, ...mixed[]) => (Promise<Action[]> | Action[])) {
  return async (laundryId: mixed, ...args: mixed[]) => {
    const lId = validateObjectId(laundryId)
    if (!lId) return []
    const laundry = await fetchLaundry(currentUserId, lId)
    if (!laundry) return []
    return fn(laundry, ...args)
  }
}

function setupRooms (io) {
  UserHandler.lib.redux.on('action', ({id, laundries, action}) => {
    debug(`Got redux action for user: ${id}`)
    emitActions(io.to(`user.${id}`), [action])
    laundries.forEach(id => emitActions(io.to(`laundry.${id}`), [action]))
  })

  const handlers = [LaundryHandler, LaundryInvitationHandler, MachineHandler, BookingHandler]
  handlers.forEach(_Handler => {
    debug(`Listening on ${_Handler.name}`)
    _Handler.lib.redux.on('action', ({laundries, action}) => {
      debug(`Got redux action for laundries: ${laundries.join(', ')}`)
      if (!laundries.length) return emitActions(io, [action])
      laundries.forEach(id => emitActions(io.to(`laundry.${id}`), [action]))
    })
  })
}

function userToRooms (user) {
  const laundries = user.model.laundries
  return [`user.${user.model.id}`].concat(laundries.map(id => `laundry.${id.toString()}`))
}

function errorLogger (err) {
  if (!err) return
  logError(err)
}

function validateNumber (n: mixed): number | null {
  return typeof n === 'number' ? n : null
}

function validateString (s: mixed): string | null {
  return typeof s === 'string' ? s : null
}

function validateObjectId (s: mixed): string | null {
  return typeof s === 'string' && mongoDbId.test(s) ? s : null
}

function validateDate (date: mixed): ?DateObject {
  if (!date) {
    return null
  }
  if (typeof date !== 'object') {
    return null
  }
  const year = validateNumber(date.year)
  if (year === null) return null
  const month = validateNumber(date.month)
  if (month === null) return null
  const day = validateNumber(date.day)
  if (day === null) return null
  return {day, year, month}
}

function setupFunctions (socket) {
  defineLaundrySocketFunction(
    socket,
    'listBookingsInTime',
    async (laundry, fromO, toO) => {
      const from = validateDate(fromO)
      if (!from) return []
      const to = validateDate(toO)
      if (!to) return []
      const bookings = await laundry.fetchBookings(from, to)
      return [actionListBookings(bookings)]
    })

  defineLaundrySocketFunction(
    socket,
    'listBookingsForUser',
    async (laundry, userId, filter) => {
      const uid = validateObjectId(userId)
      if (!uid) {
        return []
      }
      const bookings = await BookingHandler
        .lib
        .find(Object.assign({}, filter,
          {machine: {$in: laundry.model.machines}, owner: uid}),
          {sort: {from: 1, to: 1}})
      return [
        {
          type: 'LIST_BOOKINGS_FOR_USER',
          payload: {user: uid, bookings: bookings.map((b: BookingHandler) => b.reduxModel())}
        }]
    })

  defineLaundrySocketFunction(socket, 'listUsersAndInvites',
    async laundry => {
      const users = laundry.fetchUsers()
      const invites = laundry.fetchInvites()
      return [actionListUsers(await users), actionsListInvites(await invites)]
    })

  defineLaundrySocketFunction(socket, 'listMachinesAndUsers',
    async laundry => {
      const users = laundry.fetchUsers()
      const machines = laundry.fetchMachines()
      return [actionListUsers(await users), actionListMachines(await machines)]
    }
  )
  defineLaundrySocketFunction(socket, 'listMachines',
    async laundry => {
      const machines = await laundry.fetchMachines()
      return [actionListMachines(machines)]
    })

  defineLaundrySocketFunction(
    socket,
    'fetchLaundry',
    laundry => [actionListLaundries([laundry])])
}

type O = { q?: string, limit?: number, skip?: number }

function find (_Handler, options: O, fields: string[] = []) {
  debug('Finding with options', options)
  const filter = {}
  const {q} = options
  if (q && fields.length) {
    filter.$or = fields
      .map(field => {
        const obj = {}
        obj[field] = new RegExp(q, 'i')
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

function validateOptions (o: mixed): ?O {
  if (!o) return null
  if (typeof o !== 'object') return null
  const limit = validateNumber(o.limit)
  const skip = validateNumber(o.skip)
  const q = validateString(o.q)
  return {limit: limit || undefined, skip: skip || undefined, q: q || undefined}
}

function setupAdminFunctions (socket) {
  debug('Adding admin functions')
  defineSocketFunction(
    socket,
    'listLaundries',
    async options => {
      const o = validateOptions(options)
      if (!o) {
        return []
      }
      const [laundries] = await find(LaundryHandler, o, ['name'])
      return [actionListLaundries(laundries)]
    })

  defineSocketFunction(
    socket,
    'fetchUser',
    async uId => {
      const userId = validateObjectId(uId)
      if (!userId) return []
      const userP = UserHandler.lib.findFromId(userId)
      const laundriesP = LaundryHandler.lib.find({users: userId})
      return [actionListUsers([await userP]), actionListLaundries(await laundriesP)]
    })

  defineSocketFunction(
    socket,
    'listUsers',
    async options => {
      const o = validateOptions(options)
      if (!o) return []
      const [users] = await find(UserHandler, o, ['profiles.displayName', 'profiles.emails.value'])
      return [actionListUsers(users)]
    })

  defineSocketFunction(
    socket,
    'updateStats',
    async () => {
      const laundryCount = LaundryHandler.lib.fetchCount()
      const demoLaundryCount = LaundryHandler.lib.fetchCount({demo: true})
      const userCount = UserHandler.lib.fetchCount()
      const demoUserCount = UserHandler.lib.fetchCount({demo: true})
      const bookingCount = BookingHandler.lib.fetchCount()
      const machineCount = MachineHandler.lib.fetchCount()

      return [
        {
          type: 'UPDATE_STATS',
          payload: {
            demoLaundryCount: await demoLaundryCount,
            demoUserCount: await demoUserCount,
            laundryCount: await laundryCount,
            userCount: await userCount,
            bookingCount: await bookingCount,
            machineCount: await machineCount
          }
        }]
    }
  )
}

async function authenticateSocket (socket): Promise<?UserHandler> {
  debug('Authenticating user')
  const {userId, token, jwt} = socket.handshake.query || {} // Authenticate token from query
  if (userId && token) {
    debug('Got userId and token', userId, token)
    const {user, token: token2} = await UserHandler
      .lib
      .findFromIdWithTokenSecret(userId, token)
    if (user && token2) {
      token2.seen()
      user.seen()
      debug('Authentication successful')
      return user
    }
    debug('Authentication failed')
  }
  if (jwt) {
    debug('Got jwt', jwt)
    try {
      const decoded: Payload = await verify(jwt, {audience: 'https://socket.laundree.io', subject: 'user'})
      debug('Decoded token to', decoded)
      const user = decoded.userId ? await UserHandler.lib.findFromId(decoded.userId) : null
      if (user) {
        debug('Authentication successful')
        user.seen()
        return user
      }
    } catch (err) {
      debug('Authentication failed', err)
    }
  }
}

function setupRedux (io) {
  setupRooms(io)
  const userUpdateEmitter = new EventEmitter()
  UserHandler.lib.on('update', user => userUpdateEmitter.emit(user.model.id, user))
  io.on('connect', async socket => {
    debug('Connecting socket')
    const user = await authenticateSocket(socket)
    setupUser(socket, userUpdateEmitter, user)
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
  if (!user) {
    debug('Found no user, will not setup')
    return
  }
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
      errorLogger(err)
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
