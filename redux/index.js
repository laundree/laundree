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
function createInitialStore (user, successFlash = [], errorFlash = []) {
  const store = createStore(reducer)
  if (user) store.dispatch(actions.signInUser(user))
  successFlash
    .map((message) => ({type: 'success', message: message}))
    .forEach((flash) => store.dispatch(actions.flash(flash)))
  errorFlash
    .map((message) => ({type: 'error', message: message}))
    .forEach((flash) => store.dispatch(actions.flash(flash)))
  return Promise.resolve(store)
}

module.exports = {
  createInitialStore: createInitialStore
}
