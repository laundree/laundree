const {handleActions} = require('redux-actions')
const actions = require('../actions')

const actionMap = {}

actionMap[actions.types.SELECT_CURRENT_LAUNDRY] = (state, action) => action.payload.id

module.exports = handleActions(actionMap, null)
