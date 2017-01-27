/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const Timetable = require('../views/Timetable')

const mapStateToProps = ({laundries, machines, bookings, currentUser, users}, {params: {laundryId}, location: {query: {offsetDate}}}) => {
  return {laundry: laundries[laundryId], machines, bookings, offsetDate, currentUser, users}
}

module.exports = connect(mapStateToProps)(Timetable)
