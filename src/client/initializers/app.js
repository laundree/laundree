/**
 * Created by budde on 28/05/16.
 */

const Initializer = require('./initializer')
const debug = require('debug')('laundree.initializers.app')

const ReactDOM = require('react-dom')
const React = require('react')
const {BrowserRouter} = require('react-router-dom')

const io = require('socket.io-client')
const {createStore} = require('redux')
const reducers = require('../../redux/reducers')
const sdk = require('../sdk')
const App = require('../../react/containers/App')
const ReactGA = require('react-ga')
ReactGA.initialize(window.__GOOGLE_ANALYTICS__TRACKING_ID__)

const socket = io('/redux')

function setupStore () {
  const state = window.__REDUX_STATE__
  debug('Setting up store with state', state)
  const store = createStore(reducers, state)

  const dispatchAction = action => {
    debug(`Dispatching: ${action.type}`, action)
    store.dispatch(action)
  }

  socket.on('actions', actions => actions.forEach(dispatchAction))

  sdk.setupRedux(store, socket)
  return store
}

class AppInitializer extends Initializer {
  setup (element) {
    const rootElement = element.querySelector('#AppRoot')
    if (!rootElement) return
    const store = setupStore()
    const locale = store.getState().config.locale
    ReactDOM.render(
      <BrowserRouter>
        <App store={store} locale={locale} />
      </BrowserRouter>,
      rootElement)
  }
}

module.exports = AppInitializer
