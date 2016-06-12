const {handleActions} = require('redux-actions')
const actions = require('../actions')

const actionMap = {}

actionMap[actions.types.FLASH] = (state, action) => state.concat([action.payload])

module.exports = handleActions(actionMap, [])
