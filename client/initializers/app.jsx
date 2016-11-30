/**
 * Created by budde on 28/05/16.
 */

const Initializer = require('./initializer')
const debug = require('debug')('laundree.initializers.app')

const React = require('react')
const ReactDOM = require('react-dom')
const {IntlProvider} = require('react-intl')
const {Provider} = require('react-redux')
const {Router, browserHistory, match} = require('react-router')
const routeGenerator = require('../../react/routes')
const io = require('socket.io-client')
const {createStore} = require('redux')
const reducer = require('../../redux/reducer')
const sdk = require('../sdk')

const socket = io('/redux')

function setupStore () {
  const state = window.__REDUX_STATE__
  debug('Setting up store with state', state)
  const store = createStore(reducer, state)

  const dispatchAction = action => {
    debug(`Dispatching: ${action.type}`, action)
    store.dispatch(action)
  }

  socket.on('action', dispatchAction)

  socket.on('actions', actions => actions.forEach(dispatchAction))

  sdk.setupRedux(store, socket)
  return store
}

class AppInitializer extends Initializer {
  setup (element) {
    const rootElement = element.querySelector('#AppRoot')
    if (!rootElement) return
    const store = setupStore()
    match({history: browserHistory, routes: routeGenerator(store)}, (e, redirectLocation, renderProps) => {
      ReactDOM.render(
        <IntlProvider locale='en' messages={require('../../locales/en.json')}>
          <Provider store={store}>
            {React.createElement(Router, Object.assign({}, renderProps))}
          </Provider>
        </IntlProvider>, rootElement)
    })
  }
}

module.exports = AppInitializer
