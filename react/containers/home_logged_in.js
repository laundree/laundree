/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {HomeLoggedIn} = require('../views')

const mapStateToProps = (store) => {
  return {user: store.users[store.currentUser]}
}

module.exports = connect(mapStateToProps)(HomeLoggedIn)
