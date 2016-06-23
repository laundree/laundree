/**
 * Created by budde on 05/06/16.
 */
const {createAction} = require('redux-actions')

const SIGN_IN_USER = 'SIGN_IN_USER'
const SELECT_CURRENT_LAUNDRY = 'SELECT_CURRENT_LAUNDRY'
const LIST_LAUNDRIES = 'LIST_LAUNDRIES'
const FLASH = 'FLASH'
const UPDATE_USER = 'UPDATE_USER'
const CREATE_LAUNDRY = 'CREATE_LAUNDRY'
/**
 * @param {UserHandler} user
 */
function userMapper (user) {
  if (!user.model) return user
  return {
    id: user.model.id,
    photo: user.model.photo,
    displayName: user.model.displayName,
    laundries: user.model.laundries.map((id) => id.toString()),
    lastSeen: user.model.lastSeen
  }
}

function laundryMapper (laundry) {
  if (!laundry.model) return laundry
  return {
    id: laundry.model.id,
    name: laundry.model.name
  }
}

module.exports = {
  types: {
    SELECT_CURRENT_LAUNDRY: SELECT_CURRENT_LAUNDRY,
    LIST_LAUNDRIES: LIST_LAUNDRIES,
    SIGN_IN_USER: SIGN_IN_USER,
    FLASH: FLASH,
    UPDATE_USER: UPDATE_USER,
    CREATE_LAUNDRY: CREATE_LAUNDRY
  },
  selectCurrentLaundry: createAction(SELECT_CURRENT_LAUNDRY, laundryMapper),
  createLaundry: createAction(CREATE_LAUNDRY, laundryMapper),
  signInUser: createAction(SIGN_IN_USER, userMapper),
  updateUser: createAction(UPDATE_USER, userMapper),
  listLaundries: createAction(LIST_LAUNDRIES, (laundries) => laundries.map(laundryMapper)),
  flash: createAction(FLASH)
}
