// @flow

import {connect} from 'react-redux'
import UserSettings from '../views/UserSettings'

const mapStateToProps = ({users, laundries, currentUser}, {match: {params: {userId}}}) => {
  return {currentUser, user: userId, users, laundries}
}

export default connect(mapStateToProps)(UserSettings)
