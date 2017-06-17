// @flow

import {connect} from 'react-redux'
import Users from '../views/Users'

const mapStateToProps = ({laundries, users, invites, currentUser, config: {locale}}, {match: {params: {laundryId}}}) => {
  return {
    laundry: laundries[laundryId],
    locale,
    users,
    invites,
    currentUser
  }
}

export default connect(mapStateToProps)(Users)
