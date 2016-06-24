const {handleActions} = require('redux-actions')
const actions = require('../actions')
const object = require('../../utils/object')
const actionMap = {}

actionMap[actions.types.CREATE_LAUNDRY] = (state, action) => object.assignImmutable(state, action.payload.id, action.payload)

actionMap[actions.types.LIST_LAUNDRIES] = (state, action) => action.payload.reduce((obj, laundry) => {
  obj[laundry.id] = laundry
  return obj
}, {})

module.exports = handleActions(actionMap, {})
