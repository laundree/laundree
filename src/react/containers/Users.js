// @flow

import {connect} from 'react-redux'
import Users from '../views/Users'
import { localeFromLocation } from '../../locales'

const mapStateToProps = ({laundries, users, invites, currentUser}, {location, match: {params: {laundryId}}}) => {
  return {
    laundry: laundries[laundryId],
    locale: localeFromLocation(location),
    users,
    invites,
    currentUser
  }
}

export default connect(mapStateToProps)(Users)
