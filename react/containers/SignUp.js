/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const SignUp = require('../views/SignUp')

const mapStateToProps = ({location}) => ({to: location && location.query && location.query.to})

module.exports = connect(mapStateToProps)(SignUp)
