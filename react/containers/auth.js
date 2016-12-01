const connect = require('react-redux').connect
const {Auth} = require('../views')

const mapStateToProps = ({locale}) => {
  return {locale}
}

module.exports = connect(mapStateToProps)(Auth)
