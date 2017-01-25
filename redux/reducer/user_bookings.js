/**
 * Created by budde on 10/07/16.
 */

const {handleActions} = require('redux-actions')
const actions = require('../actions')

const actionMap = {}

actionMap[actions.types.LIST_BOOKINGS_FOR_USER] = (state, {payload: {user, bookings}}) => ({
  user,
  bookings: bookings.map(({id}) => id)
})

actionMap[actions.types.CREATE_BOOKING] = (state, {payload: {id, owner}}) => {
  if (!state) return null
  const {user, bookings} = state
  if (user !== owner) return state
  return {user, bookings: bookings.concat([id])}
}

actionMap[actions.types.DELETE_BOOKING] = (state, action) => {
  if (!state) return null
  const {user, bookings} = state
  return {user, bookings: bookings.filter(id => id !== action.payload)}
}

module.exports = handleActions(actionMap, null)
