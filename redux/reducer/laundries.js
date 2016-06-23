const {handleActions} = require('redux-actions')
const actions = require('../actions')

const actionMap = {}

actionMap[actions.types.SELECT_CURRENT_LAUNDRY] = (state, action) => {
  const obj = {}
  obj[action.payload.id] = action.payload
  return Object.assign({}, state, obj)
}
actionMap[actions.types.CREATE_LAUNDRY] = actionMap[actions.types.SELECT_CURRENT_LAUNDRY]
actionMap[actions.types.LIST_LAUNDRIES] = (state, action) => action.payload.reduce((obj, laundry) => {
  obj[laundry.id] = laundry
  return obj
}, {})

module.exports = handleActions(actionMap, {})
