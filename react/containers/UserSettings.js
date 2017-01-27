/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {UserSettings} = require('../views')

const mapStateToProps = ({users, laundries, currentUser}, {params: {userId}}) => {
  return {currentUser, user: userId, users, laundries}
}

module.exports = connect(mapStateToProps)(UserSettings)
