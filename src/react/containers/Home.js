const connect = require('react-redux').connect
const Home = require('../views/Home')

const mapStateToProps = ({users, currentUser}) => {
  return {users, currentUser}
}

module.exports = connect(mapStateToProps)(Home)
