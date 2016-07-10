/**
 * Created by budde on 28/05/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const TimetableTables = require('./timetable_tables.jsx')
const TimetableHeaders = require('./timetable_headers.jsx')
const {Link} = require('react-router')
const {FormattedDate} = require('react-intl')
const lodash = require('lodash')

class BookingInfo extends React.Component {

  constructor (props) {
    super(props)
    this.deleteHandler = () => this.context.actions.deleteBooking(this.props.booking.id)
  }

  renderBooking () {
    const fromDate = new Date(this.props.booking.from)
    const toDate = new Date(this.props.booking.to)
    const sameDay = fromDate.getDate() === toDate.getDate()
    const today = new Date().setHours(0, 0, 0, 0) === new Date(fromDate.getTime()).setHours(0, 0, 0, 0)
    return <div>
      <h1>Booking info</h1>
      From{' '}
      <FormattedDate
        weekday={today ? undefined : 'long'}
        month={today ? undefined : 'numeric'} day={today ? undefined : 'numeric'} hour='numeric' minute='numeric'
        value={this.props.booking.from}/> {' '}
      to{' '}
      <FormattedDate
        weekday={sameDay ? undefined : 'long'} month={sameDay ? undefined : 'numeric'}
        day={sameDay ? undefined : 'numeric'} hour='numeric' minute='numeric' value={this.props.booking.to}/>
      <div className='actions'>
        <button className='red' onClick={this.deleteHandler}>Delete booking</button>
      </div>
    </div>
  }

  render () {
    return <div id='ActiveBooking' className={this.props.booking ? '' : 'no_booking'}>
      <svg className='close' onClick={this.props.onClose}>
        <use xlinkHref='#CloseX'/>
      </svg>
      {this.props.booking ? this.renderBooking() : null}
    </div>
  }
}

BookingInfo.contextTypes = {
  actions: React.PropTypes.shape({
    deleteBooking: React.PropTypes.func
  })
}

BookingInfo.propTypes = {
  onClose: React.PropTypes.func,
  booking: React.PropTypes.object
}

class Timetable extends React.Component {

  constructor (props) {
    super(props)
    this.state = {numDays: 0, loading: true, offset: 0, hoverColumn: -1, activeBooking: null}
    this.handleResize = () => this.setState({numDays: this.numDays})
    this.todayHandler = () => this.setState({offset: 0})
    this.tomorrowHandler = () => this.setState(({offset}) => ({offset: offset + 1}))
    this.yesterdayHandler = () => this.setState(({offset}) => ({offset: Math.max(0, offset - 1)}))
    this.activeBookingHandler = (bookingId) => this.setState({activeBooking: bookingId})
    this.hoverColumn = (hoverColumn) => this.setState({hoverColumn})
    this.deactivateBookingHandler = () => this.activeBookingHandler(null)
  }

  componentDidMount () {
    window.addEventListener('resize', this.handleResize)
    const numDays = this.numDays
    this.setState({numDays: numDays, loading: false}, () => {
      if (!this._mainRef) return
      const now = this._mainRef.querySelector('#TimeTable .now')
      if (!now) return
      now.scrollIntoView()
    })
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
  }

  get numDays () {
    if (!this._mainRef) return 0
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

  renderTables () {
    const refPuller = (ref) => {
      this._mainRef = ref
    }
    const days = this.days
    return <main id='TimeTableMain' ref={refPuller} className={this.state.loading ? 'loading' : ''}>
      <TimetableHeaders
        hoverColumn={this.state.hoverColumn}
        onToday={this.todayHandler}
        onTomorrow={this.tomorrowHandler}
        onYesterday={this.yesterdayHandler}
        laundry={this.props.laundry} dates={days} machines={this.props.machines}/>
      <TimetableTables
        onActiveBooking={this.activeBookingHandler}
        activeBooking={this.state.activeBooking}
        onHoverColumn={this.hoverColumn}
        bookings={this.props.bookings}
        laundry={this.props.laundry} dates={days} machines={this.props.machines}/>
      <BookingInfo booking={this.props.bookings[this.state.activeBooking]} onClose={this.deactivateBookingHandler}/>
    </main>
  }

  renderEmpty () {
    return <main className='naved'>
      <h1 className='alignLeft'>There are no machines registered</h1>
      <section>
        Please register your machines <Link to={'/laundries/' + this.props.laundry.id + '/machines'}>here</Link>.
      </section>
    </main>
  }

  render () {
    return <DocumentTitle title='Timetable'>
      {this.props.laundry.machines.length ? this.renderTables() : this.renderEmpty()}
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
