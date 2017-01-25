/**
 * Created by budde on 05/06/16.
 */
const {combineReducers} = require('redux')
const {setupSingleton, setupList, setupCollection} = require('./helpers')
const actions = require('../actions')

const users = setupCollection(
  [actions.types.SIGN_IN_USER, actions.types.UPDATE_USER],
  [],
  [actions.types.LIST_USERS])

const laundries = module.exports = setupCollection(
  [actions.types.UPDATE_LAUNDRY, actions.types.CREATE_LAUNDRY],
  [actions.types.DELETE_LAUNDRY],
  [actions.types.LIST_LAUNDRIES])

const machines = setupCollection(
  [actions.types.UPDATE_MACHINE, actions.types.CREATE_MACHINE],
  [actions.types.DELETE_MACHINE],
  [actions.types.LIST_MACHINES])

const mappers = {}
mappers[actions.types.LIST_BOOKINGS_FOR_USER] = ({bookings}) => bookings

const bookings = setupCollection(
    [actions.types.UPDATE_BOOKING, actions.types.CREATE_BOOKING],
    [actions.types.DELETE_BOOKING],
    [actions.types.LIST_BOOKINGS, actions.types.LIST_BOOKINGS_FOR_USER],
    mappers)

const invites = setupCollection(
  [actions.types.CREATE_INVITATION, actions.types.UPDATE_INVITATION],
  [actions.types.DELETE_INVITATION],
  [actions.types.LIST_INVITATIONS])

module.exports = combineReducers({
  users,
  userList: setupList(actions.types.LIST_USERS),
  userListSize: setupSingleton(actions.types.UPDATE_USER_LIST_SIZE),
  currentUser: setupSingleton(actions.types.SIGN_IN_USER, null, p => p.id),
  flash: setupSingleton(actions.types.FLASH, [], (payload, state) => state.concat([payload])),
  laundries,
  laundryList: setupList(actions.types.LIST_LAUNDRIES),
  laundryListSize: setupSingleton(actions.types.UPDATE_LAUNDRY_LIST_SIZE),
  machines,
  bookings,
  userBookings: require('./user_bookings'),
  invites,
  stats: setupSingleton(actions.types.UPDATE_STATS),
  jobs: setupSingleton(actions.types.FINISH_JOB),
  config: setupSingleton(actions.types.CONFIGURE)
})
