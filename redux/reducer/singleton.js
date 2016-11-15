const {handleActions} = require('redux-actions')

function setupSingleton (type, defaultValue = null) {
  const actionMap = {}
  actionMap[type] = (state, {payload}) => payload
  return handleActions(actionMap, defaultValue)
}

module.exports = {setupSingleton}
