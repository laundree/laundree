const actions = require('../actions')
const {setupCollection} = require('./collection')

module.exports = setupCollection(
  [actions.types.UPDATE_MACHINE, actions.types.CREATE_MACHINE],
  [actions.types.DELETE_MACHINE],
  [actions.types.LIST_MACHINES])
