/**
 * Created by budde on 28/05/16.
 */
const {createStore} = require('redux')
const reducer = require('./reducer')
const actions = require('./actions')
const Promise = require('promise')

function mapFlash (flashArray, type) {
  return flashArray
    .map((message) => ({type: type, message: message}))
    .map((flash) => actions.flash(flash))
}

/**
 * @param laundry
 * @returns {Promise.<{machines, users, invites}>}
 */
function fetchLaundry (laundry) {
  return Promise
    .all([laundry.fetchMachines(), laundry.fetchUsers(), laundry.fetchInvites()])
    .then(([machines, users, invites]) => ({machines, users, invites}))
}

function fetchLaundries (laundries) {
  return Promise
    .all(laundries.map(fetchLaundry))
    .then((r) => r.reduce((obj, next) => {
      return {
        machines: obj.machines.concat(next.machines),
        users: obj.users.concat(next.users),
        invites: obj.invites.concat(next.invites)
      }
    }, {machines: [], users: [], invites: []}))
    .then(({machines, users, invites}) => ({
      machines,
      users,
      invites,
      laundries
    }))
}

/**
 * Create initial store
 * @param {UserHandler} currentUser
 * @param {Array=} successFlash
 * @param {Array=} errorFlash
 * @return {Promise}
 */
function createInitialEvents (currentUser, successFlash = [], errorFlash = []) {
  var events = mapFlash(successFlash, 'success')
  events = events.concat(mapFlash(errorFlash, 'error'))
  if (!currentUser) return Promise.resolve(events)
  events.push(actions.signInUser(currentUser))

  return currentUser.fetchLaundries()
    .then(fetchLaundries)
    .then(({laundries, machines, users, invites}) => {
      laundries = laundries.filter((l) => l)
      if (!laundries.length) return events
      machines = machines.filter((m) => m)
      users = users.filter((u) => u)
      invites = invites.filter((i) => i)
      events.push(actions.listLaundries(laundries))
      events.push(actions.listMachines(machines))
      events.push(actions.listUsers(users))
      events.push(actions.listInvites(invites))
      return events
    })
}

function createInitialStore (currentUser, successFlash = [], errorFlash = []) {
  return createInitialEvents(currentUser, successFlash, errorFlash)
    .then((events) => {
      const store = createStore(reducer)
      events.forEach((event) => store.dispatch(event))
      return store
    })
}

module.exports = {
  createInitialStore, createInitialEvents, actions, reducer
}
