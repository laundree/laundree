// @flow

import Debug from 'debug'
import ReactDOM from 'react-dom'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import io from 'socket.io-client'
import { createStore } from 'redux'
import sdk from './sdk'
import App from '../react/containers/App'
import ReactGA from 'react-ga'
import { redux } from 'laundree-sdk'

ReactGA.initialize(window.__GOOGLE_ANALYTICS__TRACKING_ID__)

const debug = Debug('laundree.initializers.app')

const socket = io('/redux')

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
  const locale = store.getState().config.locale
  ReactDOM.render(
    <BrowserRouter>
      <App store={store} locale={locale}/>
    </BrowserRouter>,
    rootElement)
}

export default setup
