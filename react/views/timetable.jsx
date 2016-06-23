/**
 * Created by budde on 28/05/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')

const Timetable = (props) =>
  <DocumentTitle title={props.laundry.name}>
    <main>

    </main>
  </DocumentTitle>

Timetable.propTypes = {
  laundry: React.PropTypes.shape({
    id: React.PropTypes.string,
    name: React.PropTypes.string
  })
}

module.exports = Timetable
