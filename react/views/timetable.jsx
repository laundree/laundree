/**
 * Created by budde on 28/05/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const TimetableTables = require('./timetable_tables.jsx')
const TimetableHeaders = require('./timetable_headers.jsx')

const Timetable = (props) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
//  const date2 = new Date(date.getTime() + 24 * 60 * 60 * 1000)
//  const date3 = new Date(date2.getTime() + 24 * 60 * 60 * 1000)
  return <DocumentTitle title='Timetable'>
    <main id='TimeTableMain'>
      <TimetableHeaders laundry={props.laundry} dates={[date]} machines={props.machines}/>
      <TimetableTables laundry={props.laundry} dates={[date]} machines={props.machines}/>
    </main>
  </DocumentTitle>
}

Timetable.propTypes = {
  machines: React.PropTypes.object,
  laundry: React.PropTypes.shape({
    id: React.PropTypes.string,
    name: React.PropTypes.string
  })
}

module.exports = Timetable
