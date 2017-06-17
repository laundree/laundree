// @flow

import {connect} from 'react-redux'
import AdminPanel from '../views/AdminPanel'

const mapStateToProps = ({users, userList, userListSize, stats, currentUser, laundries, laundryList, laundryListSize}) => {
  return {user: users[currentUser], stats, laundries, users, userList, userListSize, laundryList, laundryListSize}
}

export default connect(mapStateToProps)(AdminPanel)
