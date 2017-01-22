/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {HomeLoggedIn} = require('../views')

const mapStateToProps = ({users, currentUser, config: {googleApiKey, locale}}) => {
  return {user: users[currentUser], googleApiKey, locale}
}

module.exports = connect(mapStateToProps)(HomeLoggedIn)
