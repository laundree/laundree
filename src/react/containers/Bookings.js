// @flow

import {connect} from 'react-redux'
import Bookings from '../views/Bookings'
import { localeFromLocation } from '../../locales'

const mapStateToProps = ({
  users, laundries, machines,
  currentUser, bookings, userBookings
},
  {location, match: {params: {laundryId}}}) => {
  return {
    user: users[currentUser],
    laundry: laundries[laundryId],
    locale: localeFromLocation(location),
    machines,
    bookings,
    userBookings: userBookings ? userBookings.bookings : null
  }
}

export default connect(mapStateToProps)(Bookings)
