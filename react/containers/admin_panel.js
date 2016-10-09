/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const AdminPanel = require('../views/admin_panel.jsx')

const mapStateToProps = ({users, stats, currentUser, laundries}) => {
  return {user: users[currentUser], stats, laundries, users}
}

module.exports = connect(mapStateToProps)(AdminPanel)
