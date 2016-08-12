/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {LeftNav} = require('../views')

const mapStateToProps = ({laundries, currentUser}, {params: {id}}) => {
  return {
    laundry: laundries[id],
    currentUser
  }
}

module.exports = connect(mapStateToProps)(LeftNav)
