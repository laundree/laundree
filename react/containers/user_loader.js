const connect = require('react-redux').connect
const {UserLoader} = require('../views')

const mapStateToProps = ({users, laundries}, {params: {userId}}) => {
  return {userId, users, laundries}
}

module.exports = connect(mapStateToProps)(UserLoader)
