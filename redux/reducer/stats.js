const {handleActions} = require('redux-actions')
const actions = require('../actions')

const actionMap = {}

actionMap[actions.types.UPDATE_STATS] = (state, {payload}) => payload

module.exports = handleActions(actionMap, null)
