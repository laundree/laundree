/**
 * Created by budde on 28/05/16.
 */
const {createStore} = require('redux')
const reducer = require('./reducer')
const actions = require('./actions')

const {LaundryHandler, UserHandler} = require('../handlers')

function mapFlash (flashArray, type) {
  return flashArray
    .map((message) => ({type: type, message: message}))
    .map((flash) => actions.flash(flash))
}

function fetchLaundries (currentUser, url) {
  if (!currentUser.isAdmin) return currentUser.fetchLaundries().then(actions.listLaundries)
  return fetchInstance(url, /\/laundries\/([^/]+)/, LaundryHandler)
    .then(laundry => laundry ? [actions.listLaundries([laundry])] : [])
}

function fetchUsers (currentUser, url) {
  if (!currentUser.isAdmin) return Promise.resolve([])
  return fetchInstance(url, /\/users\/([^/]+)/, UserHandler)
    .then(user => {
      if (!user) return []
      return user.fetchLaundries().then(ls => [actions.listUsers([user]), actions.listLaundries(ls)])
    })
}

function fetchInstance (url, pattern, _Handler) {
  const currentMatch = url.match(pattern)
  if (!currentMatch || !currentMatch[1]) return Promise.resolve()
  const currentId = currentMatch[1]
  return _Handler.findFromId(currentId)
}

/**
 * Create initial store
 * @param {UserHandler} currentUser
 * @param {Array=} successFlash
 * @param {Array=} errorFlash
 * @param {string=} url
 * @param {string=} locale
 * @return {Promise}
 */
function createInitialEvents (currentUser, successFlash = [], errorFlash = [], url = '', locale = 'en') {
  let events = mapFlash(successFlash, 'success')
  events = events.concat(mapFlash(errorFlash, 'error'))
  events.push(actions.setLocale(locale))
  if (!currentUser) return Promise.resolve(events)
  events.push(actions.signInUser(currentUser))
  return Promise
    .all([
      fetchLaundries(currentUser, url),
      fetchUsers(currentUser, url)
    ])
    .then(evts => evts.reduce((e1, e2) => e1.concat(e2), events))
}

function createInitialStore (currentUser, successFlash = [], errorFlash = [], url = '', locale = 'en') {
  return createInitialEvents(currentUser, successFlash, errorFlash, url, locale)
    .then((events) => {
      const store = createStore(reducer)
      events.forEach((event) => store.dispatch(event))
      return store
    })
}

module.exports = {
  createInitialStore, createInitialEvents, actions, reducer
}
