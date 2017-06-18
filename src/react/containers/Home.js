// @flow
import {connect} from 'react-redux'
import Home from '../views/Home'

const mapStateToProps = ({users, currentUser}) => {
  return {users, currentUser}
}

export default connect(mapStateToProps)(Home)
