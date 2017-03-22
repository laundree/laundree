/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const Timetable = require('../views/Timetable')
const queryString = require('querystring')
const mapStateToProps = ({laundries, machines, bookings, currentUser, users}, {match: {params: {laundryId}}, location: {search}}) => {
  const {offsetDate} = queryString.parse(search && search.substr(1))
  return {laundry: laundries[laundryId], machines, bookings, offsetDate, currentUser, users}
}

module.exports = connect(mapStateToProps)(Timetable)
