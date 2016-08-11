const actions = require('../actions')
const {setupCollection} = require('./collection')

module.exports = setupCollection(
  [actions.types.CREATE_INVITATION, actions.types.UPDATE_INVITATION],
  [actions.types.DELETE_INVITATION],
  [actions.types.LIST_INVITATIONS])
