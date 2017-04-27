const connect = require('react-redux').connect
const NativeAppV2 = require('../views/NativeAppV2')

const mapStateToProps = ({currentUser, users}) => {
  return {currentUser, users}
}

module.exports = connect(mapStateToProps)(NativeAppV2)
