const actions = require('../actions')
const {setupCollection} = require('./collection')

module.exports = setupCollection(
  [actions.types.UPDATE_BOOKING, actions.types.CREATE_BOOKING],
  actions.types.DELETE_BOOKING, actions.types.LIST_BOOKINGS)
