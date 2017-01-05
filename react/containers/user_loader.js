const connect = require('react-redux').connect
const {UserLoader} = require('../views')

const mapStateToProps = (_, {params: {userId}}) => {
  return {userId}
}

module.exports = connect(mapStateToProps)(UserLoader)
