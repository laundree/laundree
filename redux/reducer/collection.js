/**
 * Created by budde on 25/06/16.
 */
const {handleActions} = require('redux-actions')
const object = require('../../utils/object')

function arrayToObject (array) {
  return array.reduce((obj, element) => {
    obj[element.id] = element
    return obj
  }, {})
}

/**
 * Setup the collection
 * @param {string[]} addActions Will add an entry
 * @param {string[]} deleteActions Will delete a given id
 * @param {string[]} listActions Will replace state with given entries.
 */
function setupCollection (addActions, deleteActions = [], listActions = []) {
  const actionMap = {}
  addActions.forEach((action) => {
    actionMap[action] = (state, action) => object.assignImmutable(state, action.payload.id, action.payload)
  })
  deleteActions.forEach((deleteAction) => {
    actionMap[deleteAction] = (state, action) => Object.keys(state).reduce((s, key) => {
      if (key === action.payload) return s
      s[key] = state[key]
      return s
    }, {})
  })
  listActions.forEach((listAction) => {
    if (listAction) {
      actionMap[listAction] = (state, action) => Object.assign({}, state, arrayToObject(action.payload))
    }
  })
  return handleActions(actionMap, {})
}

module.exports = {setupCollection}
