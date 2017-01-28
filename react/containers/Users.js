/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const Users = require('../views/Users')

const mapStateToProps = ({laundries, users, invites, currentUser, config: {locale}}, {params: {laundryId}}) => {
  return {
    laundry: laundries[laundryId],
    locale,
    users,
    invites,
    currentUser
  }
}

module.exports = connect(mapStateToProps)(Users)
