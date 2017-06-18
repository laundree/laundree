// @flow

import {connect} from 'react-redux'
import BaseApp from '../views/BaseApp'

const mapStateToProps = ({users, currentUser, laundries, config}, {location, match: {params: {laundryId}}}) => {
  return {
    config,
    location,
    user: users[currentUser],
    laundries,
    currentLaundry: laundryId
  }
}

export default connect(mapStateToProps)(BaseApp)
