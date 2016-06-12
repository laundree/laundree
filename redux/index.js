/**
 * Created by budde on 28/05/16.
 */
const {createStore} = require('redux')
const reducer = require('./reducer')
const actions = require('./actions')

function dispatchFlashs (store, flashArray, type) {
  flashArray
    .map((message) => ({type: type, message: message}))
    .forEach((flash) => store.dispatch(actions.flash(flash)))
}

/**
 * Create initial store
 * @param {UserHandler} user
 * @return {Promise}
 */
function createInitialStore (user, successFlash = [], errorFlash = []) {
  const store = createStore(reducer)
  if (user) store.dispatch(actions.signInUser(user))
  dispatchFlashs(store, successFlash, 'success')
  dispatchFlashs(store, errorFlash, 'error')
  return Promise.resolve(store)
}

module.exports = {
  createInitialStore: createInitialStore
}
