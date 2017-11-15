// @flow

import { connect } from 'react-redux'
import LaundrySettings from '../views/LaundrySettings'
import { localeFromLocation } from '../../locales'

const mapStateToProps = ({users, currentUser, laundries, config: {googleApiKey}}, {location, match: {params: {laundryId}}}) => {
  return {
    user: users[currentUser],
    laundries,
    currentLaundry: laundryId,
    locale: localeFromLocation(location),
    googleApiKey
  }
}

export default connect(mapStateToProps)(LaundrySettings)
