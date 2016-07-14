/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {Users} = require('../views')

const mapStateToProps = ({laundries, users}, {params: {id}}) => {
  return {
    laundry: laundries[id],
    users
  }
}

module.exports = connect(mapStateToProps)(Users)
