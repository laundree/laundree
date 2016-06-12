/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {App} = require('../views')
const lodash = require('lodash')

const mapStateToProps = (store) => {
  return {user: lodash.cloneDeep(store.users[store.currentUser])}
}

module.exports = connect(mapStateToProps)(App)
