const actions = require('../actions')
const {setupCollection} = require('./collection')

module.exports = setupCollection(
  actions.types.UPDATE_LAUNDRY,
  actions.types.CREATE_LAUNDRY,
  actions.types.DELETE_LAUNDRY,
  actions.types.LIST_LAUNDRIES)
