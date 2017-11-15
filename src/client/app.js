// @flow

import Debug from 'debug'
import ReactDOM from 'react-dom'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import io from 'socket.io-client'
import { createStore } from 'redux'
import sdk from './sdk'
import App from '../react/views/App'
import ReactGA from 'react-ga'
import { redux } from 'laundree-sdk'
import type { State } from 'laundree-sdk/lib/redux'
import { toLocale } from '../locales'

ReactGA.initialize(window.__GOOGLE_ANALYTICS__TRACKING_ID__)

const debug = Debug('laundree.initializers.app')

function setupStore () {
  const state = window.__REDUX_STATE__
  const socketUrl = typeof state.config.socketIoBase === 'string'
    ? `${state.config.socketIoBase}/redux`
    : '/redux'
  const socket = io(socketUrl, {query: {jwt: state.config.token}})
  debug('Setting up store with state', state)
  const store = createStore(redux.reducer, state)

  const dispatchAction = action => {
    debug(`Dispatching: ${action.type}`, action)
    store.dispatch(action)
  }

  socket.on('actions', actions => actions.forEach(dispatchAction))

  sdk.setupRedux(store, socket)
  return store
}

function setup () {
  const rootElement = document.querySelector('#AppRoot')
  if (!rootElement) return
  rootElement.innerHTML = '' // TODO fix
  const store = setupStore()
  const state: State = store.getState()
  const locale = toLocale(state.config.locale || '', 'en')
  const token = state.config.token || null
  if (typeof token === 'string') {
    sdk.authenticator = () => Promise.resolve({type: 'bearer', token})
  }
  sdk.baseUrl = typeof state.config.apiBase === 'string' ? state.config.apiBase : '/api'

  // $FlowFixMe it is though
  ReactDOM.hydrate(
    <BrowserRouter>
      <App store={store} locale={locale} />
    </BrowserRouter>,
    rootElement)
}

export default setup
