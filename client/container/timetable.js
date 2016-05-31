/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const Timetable = require('../view').Timetable

const mapStateToProps = (store) => {
  var today = new Date()
  today.setHours(0, 0, 0, 0)
  var tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  return {
    machines: [{type: 'wash', label: 'A', id: 1}, {type: 'dry', label: '1', id: 2}],
    dates: [today, tomorrow],
    title: 'Bobs laundry'
  }
}

module.exports = connect(mapStateToProps)(Timetable)
