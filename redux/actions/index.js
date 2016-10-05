/**
 * Created by budde on 05/06/16.
 */
const {createAction} = require('redux-actions')

const SIGN_IN_USER = 'SIGN_IN_USER'
const LIST_LAUNDRIES = 'LIST_LAUNDRIES'
const LIST_MACHINES = 'LIST_MACHINES'
const FLASH = 'FLASH'
const UPDATE_USER = 'UPDATE_USER'
const CREATE_LAUNDRY = 'CREATE_LAUNDRY'
const UPDATE_LAUNDRY = 'UPDATE_LAUNDRY'
const CREATE_MACHINE = 'CREATE_MACHINE'
const UPDATE_MACHINE = 'UPDATE_MACHINE'
const DELETE_MACHINE = 'DELETE_MACHINE'
const DELETE_LAUNDRY = 'DELETE_LAUNDRY'
const UPDATE_BOOKING = 'UPDATE_BOOKING'
const DELETE_BOOKING = 'DELETE_BOOKING'
const CREATE_BOOKING = 'CREATE_BOOKING'
const LIST_BOOKINGS = 'LIST_BOOKINGS'
const LIST_BOOKINGS_FOR_USER = 'LIST_BOOKINGS_FOR_USER'
const LIST_USERS = 'LIST_USERS'
const CREATE_INVITATION = 'CREATE_INVITATION'
const LIST_INVITATIONS = 'LIST_INVITATIONS'
const DELETE_INVITATION = 'DELETE_INVITATION'
const UPDATE_INVITATION = 'UPDATE_INVITATION'
const UPDATE_STATS = 'UPDATE_STATS'

function mapper (handler) {
  return handler.model ? handler.reduxModel : handler
}

function arrayMapper (array) {
  return array.map(mapper)
}

module.exports = {
  types: {
    LIST_MACHINES,
    CREATE_MACHINE,
    LIST_LAUNDRIES,
    SIGN_IN_USER,
    FLASH,
    UPDATE_USER,
    CREATE_LAUNDRY,
    UPDATE_MACHINE,
    DELETE_MACHINE,
    DELETE_LAUNDRY,
    UPDATE_LAUNDRY,
    UPDATE_BOOKING,
    CREATE_BOOKING,
    DELETE_BOOKING,
    LIST_BOOKINGS,
    LIST_BOOKINGS_FOR_USER,
    LIST_USERS,
    CREATE_INVITATION,
    LIST_INVITATIONS,
    DELETE_INVITATION,
    UPDATE_INVITATION,
    UPDATE_STATS
  },
  listLaundries: createAction(LIST_LAUNDRIES, arrayMapper),
  signInUser: createAction(SIGN_IN_USER, mapper),
  listUsers: createAction(LIST_USERS, arrayMapper),
  listMachines: createAction(LIST_MACHINES, arrayMapper),
  listBookingsForUser: createAction(LIST_BOOKINGS_FOR_USER, ({user, bookings}) => ({
    user: user.model ? user.model.id : user,
    bookings: arrayMapper(bookings)
  })),
  listBookings: createAction(LIST_BOOKINGS, arrayMapper),
  listInvites: createAction(LIST_INVITATIONS, arrayMapper),
  updateStats: createAction(UPDATE_STATS),
  flash: createAction(FLASH)
}
