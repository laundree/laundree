const connect = require('react-redux').connect
const {Support} = require('../views')

const mapStateToProps = ({currentUser, users}) => {
  return {currentUser, users}
}

module.exports = connect(mapStateToProps)(Support)
