const connect = require('react-redux').connect
const NativeApp = require('../views/NativeApp')

const mapStateToProps = ({currentUser, users}) => {
  return {currentUser, users}
}

module.exports = connect(mapStateToProps)(NativeApp)
