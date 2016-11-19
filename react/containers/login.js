/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {LogIn} = require('../views')

const mapStateToProps = ({flash}, {location}) => ({flash, to: location && location.query && location.query.to})

module.exports = connect(mapStateToProps)(LogIn)
