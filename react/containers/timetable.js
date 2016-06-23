/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const Timetable = require('../views').Timetable

const mapStateToProps = (store, {params: {id}}) => {
  return {laundry: store.laundries[id]}
}

module.exports = connect(mapStateToProps)(Timetable)
