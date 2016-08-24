/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {Users} = require('../views')

const mapStateToProps = ({laundries, users, invites}, {params: {id}}) => {
  return {
    laundry: laundries[id],
    users,
    invites
  }
}

module.exports = connect(mapStateToProps)(Users)
