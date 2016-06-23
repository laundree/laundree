const {handleActions} = require('redux-actions')
const actions = require('../actions')

const actionMap = {}

actionMap[actions.types.SIGN_IN_USER] = (state, action) => {
  var obj = {}
  obj[action.payload.id] = action.payload
  return Object.assign({}, state, obj)
}

actionMap[actions.types.UPDATE_USER] = actionMap[actions.types.SIGN_IN_USER]

module.exports = handleActions(actionMap, {})
