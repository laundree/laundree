/**
 * Created by budde on 28/05/16.
 */

var React = require('react')
var TimetableHeader = require('./timetable_header.jsx')

const TimetableHeaders = (props) => <header>
  <h1>
    {props.title}
  </h1>
  <div id='TimeTableHeader'>
    {props.dates.map((date) => <TimetableHeader machines={props.machines} date={date} key={date} />)}
  </div>
</header>

TimetableHeaders.propTypes = {
  title: React.PropTypes.string.isRequired,
  dates: React.PropTypes.arrayOf(React.PropTypes.instanceOf(Date)).isRequired,
  machines: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
}

module.exports = TimetableHeaders
