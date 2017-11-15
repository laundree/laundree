// @flow

import {connect} from 'react-redux'
import UserSettings from '../views/UserSettings'
import { localeFromLocation } from '../../locales'

const mapStateToProps = ({users, laundries, currentUser}, {location, match: {params: {userId}}}) => {
  return {currentUser, user: userId, users, laundries, locale: localeFromLocation(location)}
}

export default connect(mapStateToProps)(UserSettings)
