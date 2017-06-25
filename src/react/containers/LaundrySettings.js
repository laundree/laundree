// @flow

import {connect} from 'react-redux'
import LaundrySettings from '../views/LaundrySettings'

const mapStateToProps = ({users, currentUser, laundries, config: {locale, googleApiKey}}, {match: {params: {laundryId}}}) => {
  return {
    user: users[currentUser],
    laundries,
    currentLaundry: laundryId,
    locale,
    googleApiKey
  }
}

export default connect(mapStateToProps)(LaundrySettings)
