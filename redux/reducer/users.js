const {handleActions} = require('redux-actions')
const actions = require('../actions')

const actionMap = {}

actionMap[actions.types.SIGN_IN_USER] = (state, action) => {
  var obj = {}
  obj[action.payload.id] = action.payload
  return Object.assign({}, state, obj)
}

module.exports = handleActions(actionMap, {})
