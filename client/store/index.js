/**
 * Created by budde on 28/05/16.
 */
const createStore = require('redux').createStore

const nopReducer = (state = {}, action) => {
  return state
}

module.exports = createStore(nopReducer)
