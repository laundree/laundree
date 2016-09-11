/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {LogIn} = require('../views')

const mapStateToProps = ({flash}) => ({flash})

module.exports = connect(mapStateToProps)(LogIn)
