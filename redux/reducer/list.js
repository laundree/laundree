/**
 * Created by budde on 13/11/2016.
 */
const {handleActions} = require('redux-actions')

function setupList (listAction) {
  const actionMap = {}
  actionMap[listAction] = (state, {payload}) => payload.map(({id}) => id)
  return handleActions(actionMap, [])
}

module.exports = {setupList}
