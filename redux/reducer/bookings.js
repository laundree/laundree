const actions = require('../actions')
const {setupCollection} = require('./collection')

const mappers = {}
mappers[actions.types.LIST_BOOKINGS_FOR_USER] = ({bookings}) => bookings

module.exports = setupCollection(
  [actions.types.UPDATE_BOOKING, actions.types.CREATE_BOOKING],
  [actions.types.DELETE_BOOKING],
  [actions.types.LIST_BOOKINGS, actions.types.LIST_BOOKINGS_FOR_USER],
  mappers)
