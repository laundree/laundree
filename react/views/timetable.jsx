/**
 * Created by budde on 28/05/16.
 */
const React = require('react')
const TimetableHeaders = require('./timetable_headers.jsx')
const TimetableTables = require('./timetable_tables.jsx')
const DocumentTitle = require('react-document-title')

const Timetable = (props) =>
  <main>
    <DocumentTitle title='Timetable'>
      <TimetableHeaders title={props.title} dates={props.dates} machines={props.machines}/>
      <TimetableTables dates={props.dates} machines={props.machines}/>
    </DocumentTitle>
  </main>

Timetable.propTypes = {
  title: React.PropTypes.string.isRequired,
  dates: React.PropTypes.arrayOf(React.PropTypes.instanceOf(Date)).isRequired,
  machines: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
}

module.exports = Timetable
