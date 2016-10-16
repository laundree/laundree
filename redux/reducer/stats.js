const actions = require('../actions')

const {setupSingleton} = require('./singleton')

module.exports = setupSingleton(actions.types.UPDATE_STATS)
