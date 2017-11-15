// @flow

import {connect} from 'react-redux'
import LeftNav from '../views/LeftNav'
import { localeFromLocation } from '../../locales'

const mapStateToProps = ({users, laundries, currentUser}, {location, match: {params: {laundryId}}}) => {
  return {
    laundries,
    locale: localeFromLocation(location),
    currentLaundry: laundryId,
    user: users[currentUser]
  }
}

export default connect(mapStateToProps)(LeftNav)
