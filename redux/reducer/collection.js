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
 * @param {string=} deleteAction Will delete a given id
 * @param {string=} listAction Will replace state with given entries.
 * @param {string=} loadAction Will load given entries, overwriting duplicates.
 */
function setupCollection (addActions, deleteAction, listAction, loadAction) {
  const actionMap = {}
  addActions.forEach((action) => {
    actionMap[action] = (state, action) => object.assignImmutable(state, action.payload.id, action.payload)
  })
  if (deleteAction) {
    actionMap[deleteAction] = (state, action) => Object.keys(state).reduce((s, key) => {
      if (key === action.payload) return s
      s[key] = state[key]
      return s
    }, {})
  }
  if (listAction) {
    actionMap[listAction] = (state, action) => arrayToObject(action.payload)
  }
  if (loadAction) {
    actionMap[loadAction] = (state, action) => Object.assing({}, state, arrayToObject(action.payload))
  }
  return handleActions(actionMap, {})
}

module.exports = {setupCollection}
