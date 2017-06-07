/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const SignUp = require('../views/SignUp')
const queryString = require('querystring')

const mapStateToProps = ({location}) => ({to: location && location.search && queryString.parse(location.search.substr(1)).to})

module.exports = connect(mapStateToProps)(SignUp)
