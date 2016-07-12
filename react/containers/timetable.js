/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const Timetable = require('../views').Timetable

const mapStateToProps = ({laundries, machines, bookings}, {params: {id}, location: {query: {activeBooking, offsetDate}}}) => {
  return {laundry: laundries[id], machines, bookings, activeBooking, offsetDate}
}

module.exports = connect(mapStateToProps)(Timetable)
