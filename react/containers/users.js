/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {Users} = require('../views')

const mapStateToProps = ({laundries, users, invites, currentUser}, {params: {laundryId}}) => {
  return {
    laundry: laundries[laundryId],
    users,
    invites,
    currentUser
  }
}

module.exports = connect(mapStateToProps)(Users)
