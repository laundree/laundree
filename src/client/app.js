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
import {toLocale} from '../locales'
ReactGA.initialize(window.__GOOGLE_ANALYTICS__TRACKING_ID__)

const debug = Debug('laundree.initializers.app')

const socket = io('/redux', {transports: ['websocket']})

function setupStore () {
  const state = window.__REDUX_STATE__
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
  const store = setupStore()
  const state: State = store.getState()
  const locale = toLocale(state.config.locale || '', 'en')
  ReactDOM.render(
    <BrowserRouter>
      <App store={store} locale={locale} />
    </BrowserRouter>,
    rootElement)
}

export default setup
