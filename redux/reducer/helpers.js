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
 * @param {Object.<string, Function>} mappers
 */
function setupCollection (addActions, deleteActions = [], listActions = [], mappers = {}) {
  const actionMap = {}
  addActions.forEach(action => {
    const mapper = mappers[action] || (p => p)
    actionMap[action] = (state, {payload}) => {
      payload = mapper(payload)
      return object.assignImmutable(state, payload.id, payload)
    }
  })
  deleteActions.forEach(deleteAction => {
    const mapper = mappers[deleteAction] || (p => p)
    actionMap[deleteAction] = (state, {payload}) => Object.keys(state).reduce((s, key) => {
      if (key === mapper(payload)) return s
      s[key] = state[key]
      return s
    }, {})
  })
  listActions.forEach(listAction => {
    const mapper = mappers[listAction] || (p => p)
    actionMap[listAction] = (state, {payload}) => Object.assign({}, state, arrayToObject(mapper(payload)))
  })
  return handleActions(actionMap, {})
}

function setupList (listAction) {
  const actionMap = {}
  actionMap[listAction] = (state, {payload}) => payload.map(({id}) => id)
  return handleActions(actionMap, [])
}

function setupSingleton (type, defaultValue = null, map = v => v) {
  const actionMap = {}
  actionMap[type] = (state, {payload}) => map(payload, state)
  return handleActions(actionMap, defaultValue)
}

module.exports = {setupCollection, setupList, setupSingleton}
