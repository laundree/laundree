/**
 * Created by budde on 28/05/16.
 */

const Initializer = require('./initializer')
const debug = require('debug')('laundree.initializers.app')
const Promise = require('promise')

const React = require('react')
const ReactDOM = require('react-dom')
const {IntlProvider} = require('react-intl')
const {Provider} = require('react-redux')
const {Router, browserHistory, match} = require('react-router')
const routeGenerator = require('../../react/routes')
const io = require('socket.io-client')
const {createStore} = require('redux')
const {reducer} = require('../../redux')
const reduxActions = require('../../redux/actions')
const {ActionProvider} = require('../../react/views/providers')
const {UserClientSdk, LaundryClientSdk, MachineClientSdk, BookingClientSdk, InviteClientSdk} = require('../sdk')

const nsp = io('/redux')

function fetchStore () {
  return new Promise((resolve, reject) => {
    var store
    var actions = []
    nsp.on('action', (action) => {
      debug(action)
      if (store) return store.dispatch(action)
      actions.push(action)
    })
    nsp.on('init', (events) => {
      debug(events)
      if (!store) store = createStore(reducer)
      events.forEach((event) => store.dispatch(event))
      resolve(store)
      actions.forEach((action) => store.dispatch(action))
    })
  })
}

function signUpUser (name, email, password) {
  return UserClientSdk
    .createUser(name, email, password)
    .then((user) => user.startEmailVerification(email))
}

function startEmailVerification (email) {
  return UserClientSdk
    .userFromEmail(email)
    .then(user => {
      if (!user) throw new Error('User not found')
      return user.startEmailVerification(email)
    })
}

function userForgotPassword (email) {
  return UserClientSdk.userFromEmail(email).then((user) => {
    if (!user) throw new Error('User not found')
    return user.startPasswordReset()
  })
}

function userResetPassword (userId, token, newPassword) {
  return new UserClientSdk(userId).resetPassword(token, newPassword)
}

function createLaundry (name) {
  return LaundryClientSdk.createLaundry(name)
}

function createBooking (id, from, to) {
  return new MachineClientSdk(id).createBooking(from, to)
}

function listBookingsInTime (laundryId, from, to) {
  return nsp.emit('listBookingsInTime', laundryId, from.getTime(), to.getTime())
}

function listBookingsForUser (laundryId, userId, filter = {}) {
  return nsp.emit('listBookingsForUser', laundryId, userId, filter)
}

function listUsersAndInvites (laundryId) {
  return nsp.emit('listUsersAndInvites', laundryId)
}

function listMachines (laundryId) {
  return nsp.emit('listMachines', laundryId)
}

function listMachinesAndUsers (laundryId) {
  return nsp.emit('listMachinesAndUsers', laundryId)
}

function updateStats () {
  return nsp.emit('updateStats')
}

function deleteBooking (id) {
  return new BookingClientSdk(id).deleteBooking()
}

function inviteUserByEmail (laundryId, email) {
  return new LaundryClientSdk(laundryId).inviteUserByEmail(email)
}

function deleteLaundry (laundryId) {
  return new LaundryClientSdk(laundryId).deleteLaundry()
}

function deleteInvite (id) {
  return new InviteClientSdk(id).deleteInvite()
}

function removeUserFromLaundry (laundryId, userId) {
  return new LaundryClientSdk(laundryId).removeUserFromLaundry(userId)
}

class AppInitializer extends Initializer {
  setup (element) {
    const rootElement = element.querySelector('#AppRoot')
    if (!rootElement) return
    fetchStore().then((store) => {
      const actions = {
        userForgotPassword,
        signUpUser,
        createLaundry,
        userResetPassword,
        createBooking,
        deleteBooking,
        listBookingsInTime,
        listBookingsForUser,
        inviteUserByEmail,
        deleteLaundry,
        startEmailVerification,
        deleteInvite,
        removeUserFromLaundry,
        listUsersAndInvites,
        listMachines,
        listMachinesAndUsers,
        updateStats
      }
      if (window.__FLASH_MESSAGES__) window.__FLASH_MESSAGES__.forEach((message) => store.dispatch(reduxActions.flash(message)))
      match({history: browserHistory, routes: routeGenerator(store)}, (e, redirectLocation, renderProps) => {
        ReactDOM.render(
          <ActionProvider actions={actions}>
            <IntlProvider locale='en'>
              <Provider store={store}>
                {React.createElement(Router, Object.assign({}, renderProps))}
              </Provider>
            </IntlProvider>
          </ActionProvider>, rootElement)
      })
    })
  }
}

module.exports = AppInitializer
