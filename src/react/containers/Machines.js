// @flow

import {connect} from 'react-redux'
import Machines from '../views/Machines'

const mapStateToProps = ({users, currentUser, laundries, machines}, {match: {params: {laundryId}}}) => {
  return {
    user: users[currentUser],
    laundries,
    machines,
    currentLaundry: laundryId
  }
}
export default connect(mapStateToProps)(Machines)
