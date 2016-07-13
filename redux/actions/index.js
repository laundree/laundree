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

/**
 * @param {UserHandler} user
 */
function userMapper (user) {
  if (!user.model) return user
  return {
    id: user.model.id,
    photo: user.model.photo,
    displayName: user.model.displayName,
    laundries: user.model.laundries.map((id) => id.toString()),
    lastSeen: user.model.lastSeen
  }
}

function laundryMapper (laundry) {
  if (!laundry.model) return laundry
  return {
    id: laundry.model.id,
    name: laundry.model.name,
    machines: laundry.machineIds,
    users: laundry.model.users.map((id) => id.toString()),
    owners: laundry.model.owners.map((id) => id.toString())
  }
}

function machineMapper (machine) {
  if (!machine.model) return machine
  return {
    id: machine.model.id,
    type: machine.model.type,
    name: machine.model.name
  }
}

function bookingMapper (booking) {
  if (!booking.model) return booking
  return {
    id: booking.model.id,
    from: booking.model.from,
    to: booking.model.to,
    machine: booking.model.machine.toString()
  }
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
    LIST_BOOKINGS_FOR_USER
  },
  listLaundries: createAction(LIST_LAUNDRIES, (laundries) => laundries.map(laundryMapper)),
  createLaundry: createAction(CREATE_LAUNDRY, laundryMapper),
  updateLaundry: createAction(UPDATE_LAUNDRY, laundryMapper),
  deleteLaundry: createAction(DELETE_LAUNDRY),

  signInUser: createAction(SIGN_IN_USER, userMapper),
  updateUser: createAction(UPDATE_USER, userMapper),

  listMachines: createAction(LIST_MACHINES, (machines) => machines.map(machineMapper)),
  createMachine: createAction(CREATE_MACHINE, machineMapper),
  updateMachine: createAction(UPDATE_MACHINE, machineMapper),
  deleteMachine: createAction(DELETE_MACHINE),

  listBookingsForUser: createAction(LIST_BOOKINGS_FOR_USER, (bookings) => bookings.map(bookingMapper)),
  listBookings: createAction(LIST_BOOKINGS, (bookings) => bookings.map(bookingMapper)),
  createBooking: createAction(CREATE_BOOKING, bookingMapper),
  updateBooking: createAction(UPDATE_BOOKING, bookingMapper),
  deleteBooking: createAction(DELETE_BOOKING),

  flash: createAction(FLASH)
}
