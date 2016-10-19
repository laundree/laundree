/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {Users} = require('../views')

const mapStateToProps = ({laundries, users, invites}, {params: {laundryId}}) => {
  return {
    laundry: laundries[laundryId],
    users,
    invites
  }
}

module.exports = connect(mapStateToProps)(Users)
