/**
 * Created by budde on 25/06/16.
 */
const {handleActions} = require('redux-actions')
const object = require('../../utils/object')

function setupCollection (updateAction, createAction, deleteAction, listAction) {
  const actionMap = {}
  actionMap[updateAction] = (state, action) => object.assignImmutable(state, action.payload.id, action.payload)
  actionMap[createAction] = actionMap[updateAction]
  actionMap[deleteAction] = (state, action) => Object.keys(state).reduce((s, key) => {
    if (key === action.payload) return s
    s[key] = state[key]
    return s
  }, {})
  actionMap[listAction] = (state, action) => action.payload.reduce((obj, element) => {
    obj[element.id] = element
    return obj
  }, {})
  return handleActions(actionMap, {})
}

module.exports = {setupCollection}
