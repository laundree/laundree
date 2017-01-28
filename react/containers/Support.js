const connect = require('react-redux').connect
const Support = require('../views/Support')

const mapStateToProps = ({currentUser, users}) => {
  return {currentUser, users}
}

module.exports = connect(mapStateToProps)(Support)
