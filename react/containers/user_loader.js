const connect = require('react-redux').connect
const {UserLoader} = require('../views')

const mapStateToProps = ({users}, {params: {userId}}) => {
  return {userId, users}
}

module.exports = connect(mapStateToProps)(UserLoader)
