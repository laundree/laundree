/**
 * Created by budde on 28/05/16.
 */
const {createStore} = require('redux')
const actions = require('../redux/actions')
const reducers = require('../redux/reducers')

function mapFlash (flashArray, type) {
  return flashArray
    .map((message) => ({type: type, message: message}))
    .map((flash) => actions.flash(flash))
}

function fetchLaundries (currentUser) {
  return currentUser.fetchLaundries().then(actions.listLaundries)
}

/**
 * Create initial store
 * @param {UserHandler} currentUser
 * @param {Array=} successFlash
 * @param {Array=} errorFlash
 * @param {string=} locale
 * @param {string=} googleApiKey
 * @param {boolean=} returningUser
 * @return {Promise}
 */
function createInitialEvents (currentUser, successFlash = [], errorFlash = [], locale = 'en', googleApiKey = '', returningUser = false) {
  let events = mapFlash(successFlash, 'success')
  events = events.concat(mapFlash(errorFlash, 'error'))
  events.push(actions.configure({locale, googleApiKey, returningUser}))
  if (!currentUser) return Promise.resolve(events)
  events.push(actions.signInUser(currentUser))
  return fetchLaundries(currentUser).then(event => events.concat(event))
}

function createInitialStore (currentUser, successFlash = [], errorFlash = [], locale = 'en', googleApiKey = '', returningUser = false) {
  return createInitialEvents(currentUser, successFlash, errorFlash, locale, googleApiKey, returningUser)
    .then((events) => {
      const store = createStore(reducers)
      events.forEach((event) => store.dispatch(event))
      return store
    })
}

module.exports = {
  createInitialStore, createInitialEvents, actions, reducers
}
