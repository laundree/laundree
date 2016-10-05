/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const AdminPanel = require('../views/admin_panel.jsx')

const mapStateToProps = ({users, stats, currentUser}) => {
  return {user: users[currentUser], stats}
}

module.exports = connect(mapStateToProps)(AdminPanel)
