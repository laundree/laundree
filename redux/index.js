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
 * @param {UserHandler} currentUser
 * @param {Array=} successFlash
 * @param {Array=} errorFlash
 * @return {Promise}
 */
function createInitialStore (currentUser, successFlash = [], errorFlash = []) {
  const store = createStore(reducer)
  dispatchFlashs(store, successFlash, 'success')
  dispatchFlashs(store, errorFlash, 'error')
  if (!currentUser) return Promise.resolve(store)
  store.dispatch(actions.signInUser(currentUser))
  return currentUser.fetchLaundries().then((laundries) => {
    laundries = laundries.filter((l) => l)
    if (!laundries.length) return store
    store.dispatch(actions.listLaundries(laundries))
    return store
  })
}

module.exports = {
  createInitialStore, actions, reducer
}
