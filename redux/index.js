/**
 * Created by budde on 28/05/16.
 */
const {createStore} = require('redux')
const reducer = require('./reducer')
const actions = require('./actions')
const lodash = require('lodash')

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
  return currentUser.fetchLaundries()
    .then((laundries) => Promise.all(laundries.map((laundry) => laundry.fetchMachines()))
      .then((machines) => ({laundries, machines: lodash.flatten(machines)})))
    .then(({laundries, machines}) => {
      laundries = laundries.filter((l) => l)
      machines = machines.filter((m) => m)
      if (!laundries.length) return store
      store.dispatch(actions.listLaundries(laundries))
      store.dispatch(actions.listMachines(machines))
      return store
    })
}

module.exports = {
  createInitialStore, actions, reducer
}
