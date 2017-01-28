const connect = require('react-redux').connect
const Auth = require('../views/Auth')

const mapStateToProps = ({config: {locale}}, {location}) => {
  return {locale, location}
}

module.exports = connect(mapStateToProps)(Auth)
