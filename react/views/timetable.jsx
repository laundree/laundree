/**
 * Created by budde on 28/05/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const TimetableTables = require('./timetable_tables.jsx')
const TimetableHeaders = require('./timetable_headers.jsx')
const lodash = require('lodash')

class Timetable extends React.Component {

  constructor (props) {
    super(props)
    this.state = {numDays: 0, loading: true, offset: 0}
    this.handleResize = () => this.setState({numDays: this.numDays})
    this.todayHandler = () => this.setState({offset: 0})
    this.tomorrowHandler = () => this.setState(({offset}) => ({offset: offset + 1}))
    this.yesterdayHandler = () => this.setState(({offset}) => ({offset: Math.max(0, offset - 1)}))
  }

  componentDidMount () {
    window.addEventListener('resize', this.handleResize)
    const numDays = this.numDays
    this.setState({numDays: numDays, loading: false}, () => {
      const now = this._mainRef.querySelector('#TimeTable .now')
      if (!now) return
      now.scrollIntoView()
    })
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
  }

  get numDays () {
    return Math.min(Math.max(Math.floor(this._mainRef.offsetWidth / (this.props.laundry.machines.length * 100)), 1), 7)
  }

  get days () {
    const startDay = new Date()
    startDay.setHours(0, 0, 0, 0)
    return lodash.range(this.state.offset, this.state.offset + this.state.numDays).map((i) => {
      const d = new Date(startDay.getTime())
      d.setDate(startDay.getDate() + i)
      return d
    })
  }

  render () {
    const refPuller = (ref) => {
      this._mainRef = ref
    }
    const days = this.days
    return <DocumentTitle title='Timetable'>
      <main id='TimeTableMain' ref={refPuller} className={this.state.loading ? 'loading' : ''}>
        <TimetableHeaders
          onToday={this.todayHandler}
          onTomorrow={this.tomorrowHandler}
          onYesterday={this.yesterdayHandler}
          laundry={this.props.laundry} dates={days} machines={this.props.machines}/>
        <TimetableTables
          bookings={this.props.bookings}
          laundry={this.props.laundry} dates={days} machines={this.props.machines}/>
      </main>
    </DocumentTitle>
  }
}

Timetable.propTypes = {
  machines: React.PropTypes.object,
  bookings: React.PropTypes.object,
  laundry: React.PropTypes.shape({
    id: React.PropTypes.string,
    name: React.PropTypes.string,
    machines: React.PropTypes.array
  })
}

module.exports = Timetable
