// @flow

import { connect } from 'react-redux'
import Timetable from '../views/Timetable'
import queryString from 'querystring'
import { localeFromLocation } from '../../locales'

const mapStateToProps = ({laundries, machines, bookings, currentUser, users}, {location, match: {params: {laundryId}}, location: {search}}) => {
  const {offsetDate} = queryString.parse(search && search.substr(1))
  return {laundry: laundries[laundryId], machines, bookings, offsetDate, currentUser, users, locale: localeFromLocation(location)}
}

export default connect(mapStateToProps)(Timetable)
