const actions = require('../actions')
const {setupCollection} = require('./collection')

module.exports = setupCollection([actions.types.SIGN_IN_USER, actions.types.UPDATE_USER])
