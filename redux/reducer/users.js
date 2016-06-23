const {handleActions} = require('redux-actions')
const actions = require('../actions')
const object = require('../../utils/object')

const actionMap = {}

actionMap[actions.types.SIGN_IN_USER] = (state, action) => object.assignImmutable(state, action.payload.id, action.payload)

actionMap[actions.types.UPDATE_USER] = actionMap[actions.types.SIGN_IN_USER]

module.exports = handleActions(actionMap, {})
