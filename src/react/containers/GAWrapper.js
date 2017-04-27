/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const GAWrapper = require('../views/GAWrapper')

const mapStateToProps = ({currentUser}, {location}) => {
  return {currentUser, location}
}

module.exports = connect(mapStateToProps)(GAWrapper)
