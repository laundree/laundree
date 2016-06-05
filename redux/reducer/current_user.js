const {handleActions} = require('redux-actions')
const actions = require('../actions')

const actionMap = {}

actionMap[actions.types.SIGN_IN_USER] = (state, action) => action.payload.id

module.exports = handleActions(actionMap, null)
