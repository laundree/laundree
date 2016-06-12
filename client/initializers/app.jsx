/**
 * Created by budde on 28/05/16.
 */

const Initializer = require('./initializer')

const React = require('react')
const ReactDOM = require('react-dom')
const {IntlProvider} = require('react-intl')
const {Provider} = require('react-redux')
const {Router, browserHistory, match} = require('react-router')
const routeGenerator = require('../../react/routes')
const io = require('socket.io-client')
const {createStore} = require('redux')
const reducer = require('../../redux/reducer')
const reduxActions = require('../../redux/actions')
const {ActionProvider} = require('../../react/views/providers')
const {UserClientApi} = require('../api')

function fetchStore () {
  return new Promise((resolve, reject) => {
    var store
    var actions = []
    var nsp = io('/redux')
    nsp.on('action', (action) => {
      console.log(action)
      if (store) return store.dispatch(action)
      actions.push(action)
    })
    nsp.on('init', (state) => {
      if (store) return
      store = createStore(reducer, state)
      resolve(store)
      actions.forEach((action) => store.dispatch(action))
    })
  })
}

function signUpUser (name, email, password) {
  return UserClientApi
    .createUser(name, email, password)
    .then((user) => user.startEmailVerification(email))
}

function userForgotPassword (email) {
  return UserClientApi.userFromEmail(email).then((user) => {
    if (!user) throw new Error('User not found')
    return user.startPasswordReset()
  })
}

class AppInitializer extends Initializer {
  setup (element) {
    const rootElement = element.querySelector('#AppRoot')
    if (!rootElement) return
    const actions = {
      userForgotPassword: userForgotPassword,
      signUpUser: signUpUser
    }
    fetchStore().then((store) => {
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
