/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {Settings} = require('../views')

const mapStateToProps = ({currentUser, users, laundries}) => {
  return {currentUser, users, laundries}
}

module.exports = connect(mapStateToProps)(Settings)
