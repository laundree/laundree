/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {App} = require('../views')
const lodash = require('lodash')

const mapStateToProps = (store, {params: {id}}) => {
  return {
    user: lodash.cloneDeep(store.users[store.currentUser]),
    currentLaundry: id
  }
}

module.exports = connect(mapStateToProps)(App)
