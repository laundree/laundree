/**
 * Created by budde on 28/05/16.
 */

const Initializer = require('./initializer')

const React = require('react')
const ReactDOM = require('react-dom')
const {IntlProvider} = require('react-intl')
const {Provider} = require('react-redux')
const {Router, browserHistory, match} = require('react-router')
const routes = require('../../react/routes')
const io = require('socket.io-client')
const {createStore} = require('redux')
const reducer = require('../../redux/reducer')
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

class AppInitializer extends Initializer {
  setup (element) {
    const rootElement = element.querySelector('#AppRoot')
    if (!rootElement) return
    fetchStore().then((store) => {
      match({history: browserHistory, routes}, (e, redirectLocation, renderProps) => {
        ReactDOM.render(
          <IntlProvider locale='en'>
            <Provider store={store}>
              {React.createElement(Router, Object.assign({}, renderProps))}
            </Provider>
          </IntlProvider>, rootElement)
      })
    })
  }
}

module.exports = AppInitializer
