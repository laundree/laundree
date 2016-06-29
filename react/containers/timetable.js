/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const Timetable = require('../views').Timetable

const mapStateToProps = ({laundries, machines}, {params: {id}}) => {
  return {laundry: laundries[id], machines}
}

module.exports = connect(mapStateToProps)(Timetable)
