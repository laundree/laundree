/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const Login = require('../views/Login')
const queryString = require('querystring')

const mapStateToProps = ({flash}, {location}) => ({flash, to: location && location.search && queryString.parse(location.search.substr(1)).to})

module.exports = connect(mapStateToProps)(Login)
