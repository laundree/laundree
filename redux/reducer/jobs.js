const {handleActions} = require('redux-actions')
const actions = require('../actions')

const actionMap = {}

actionMap[actions.types.FINISH_JOB] = (state, {payload}) => payload

module.exports = handleActions(actionMap, null)
