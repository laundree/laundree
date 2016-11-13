/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const AdminPanel = require('../views/admin_panel.jsx')

const mapStateToProps = ({users, userList, userListSize, stats, currentUser, laundries, laundryList, laundryListSize}) => {
  return {user: users[currentUser], stats, laundries, users, userList, userListSize, laundryList, laundryListSize}
}

module.exports = connect(mapStateToProps)(AdminPanel)
