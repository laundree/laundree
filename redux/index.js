/**
 * Created by budde on 28/05/16.
 */
const {createStore} = require('redux')
const reducer = require('./reducer')
const actions = require('./actions')
const Promise = require('promise')
const {LaundryHandler} = require('../handlers')

function mapFlash (flashArray, type) {
  return flashArray
    .map((message) => ({type: type, message: message}))
    .map((flash) => actions.flash(flash))
}

function fetchLaundries (currentUser, url) {
  if (!currentUser.isAdmin) return currentUser.fetchLaundries()
  const currentLaundryMatch = url.match(/\/laundries\/([^\/]+)/)
  if (!currentLaundryMatch || !currentLaundryMatch[1]) return Promise.resolve([])
  const currentLaundryId = currentLaundryMatch[1]
  return LaundryHandler
    .findFromId(currentLaundryId)
    .then(l => [l])
}

function createLaundryEvents (events) {
  return laundries => {
    laundries = laundries.filter(l => l)
    if (!laundries.length) return events
    events.push(actions.listLaundries(laundries))
    return events
  }
}

/**
 * Create initial store
 * @param {UserHandler} currentUser
 * @param {Array=} successFlash
 * @param {Array=} errorFlash
 * @param {string=} url
 * @return {Promise}
 */
function createInitialEvents (currentUser, successFlash = [], errorFlash = [], url = '') {
  var events = mapFlash(successFlash, 'success')
  events = events.concat(mapFlash(errorFlash, 'error'))
  if (!currentUser) return Promise.resolve(events)
  events.push(actions.signInUser(currentUser))
  return fetchLaundries(currentUser, url)
    .then(createLaundryEvents(events))
}

function createInitialStore (currentUser, successFlash = [], errorFlash = [], url = '') {
  return createInitialEvents(currentUser, successFlash, errorFlash, url)
    .then((events) => {
      const store = createStore(reducer)
      events.forEach((event) => store.dispatch(event))
      return store
    })
}

module.exports = {
  createInitialStore, createInitialEvents, actions, reducer
}
