const connect = require('react-redux').connect
const StateCheckRedirectRoute = require('../views/StateCheckRedirectRoute')

const mapStateToProps = (state, props) => {
  return Object.assign({state}, props)
}

module.exports = connect(mapStateToProps)(StateCheckRedirectRoute)
