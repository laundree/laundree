// @flow

import {connect} from 'react-redux'
import Bookings from '../views/Bookings'

const mapStateToProps = ({
  users, laundries, machines,
  currentUser, bookings, userBookings
},
  {match: {params: {laundryId}}}) => {
  return {
    user: users[currentUser],
    laundry: laundries[laundryId],
    machines,
    bookings,
    userBookings: userBookings ? userBookings.bookings : null
  }
}

export default connect(mapStateToProps)(Bookings)
