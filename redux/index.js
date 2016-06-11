/**
 * Created by budde on 28/05/16.
 */
const {createStore} = require('redux')
const reducer = require('./reducer')
const actions = require('./actions')
/**
 * Create initial store
 * @param {UserHandler} user
 * @return {Promise}
 */
function createInitialStore (user) {
  const store = createStore(reducer)
  if (user) store.dispatch(actions.signInUser(user))
  return Promise.resolve(store)
}

module.exports = {
  createInitialStore: createInitialStore
}
