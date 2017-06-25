// @flow

import {connect} from 'react-redux'
import LeftNav from '../views/LeftNav'

const mapStateToProps = ({users, laundries, currentUser}, {match: {params: {laundryId}}}) => {
  return {
    laundries,
    currentLaundry: laundryId,
    user: users[currentUser]
  }
}

export default connect(mapStateToProps)(LeftNav)
