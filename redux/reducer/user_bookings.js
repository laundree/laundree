/**
 * Created by budde on 10/07/16.
 */

const {handleActions} = require('redux-actions')
const actions = require('../actions')

const actionMap = {}

actionMap[actions.types.LIST_BOOKINGS_FOR_USER] = (state, action) => action.payload.map(({id}) => id)

module.exports = handleActions(actionMap, [])
