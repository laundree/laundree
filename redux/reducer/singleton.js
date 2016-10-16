const {handleActions} = require('redux-actions')

function setupSingleton (type) {
  const actionMap = {}
  actionMap[type] = (state, {payload}) => payload
  return handleActions(actionMap, null)
}

module.exports = {setupSingleton}
