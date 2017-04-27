/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const UserSettings = require('../views/UserSettings')

const mapStateToProps = ({users, laundries, currentUser}, {match: {params: {userId}}}) => {
  return {currentUser, user: userId, users, laundries}
}

module.exports = connect(mapStateToProps)(UserSettings)
