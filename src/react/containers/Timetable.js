// @flow

import {connect} from 'react-redux'
import Timetable from '../views/Timetable'
import queryString from 'querystring'

const mapStateToProps = ({laundries, machines, bookings, currentUser, users}, {match: {params: {laundryId}}, location: {search}}) => {
  const {offsetDate} = queryString.parse(search && search.substr(1))
  return {laundry: laundries[laundryId], machines, bookings, offsetDate, currentUser, users}
}

export default connect(mapStateToProps)(Timetable)
