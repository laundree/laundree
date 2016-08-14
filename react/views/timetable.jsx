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

  renderActions () {
    if (!this.isOwner) return null
    return <div className='actions'>
      <button className='red' onClick={this.deleteHandler}>Delete booking</button>
    </div>
  }

  get isOwner () {
    return this.props.booking.owner === this.props.currentUser || this.props.laundry.owners.indexOf(this.props.currentUser) >= 0
  }

  renderBooking () {
    const booking = this.props.booking
    const owner = this.props.users[booking.owner]
    const fromDate = new Date(booking.from)
    const toDate = new Date(booking.to)
    const sameDay = new Date(fromDate.getTime()).setHours(0, 0, 0, 0) === new Date(toDate.getTime()).setHours(0, 0, 0, 0)
    const today = new Date().setHours(0, 0, 0, 0) === new Date(fromDate.getTime()).setHours(0, 0, 0, 0)
    return <div>
      <h1>Booking info</h1>
      <img src={owner.photo} className='avatar'/>
      <div className='text'>
        {owner.displayName} has booked <span>{this.props.machines[this.props.booking.machine].name}</span> from{' '}
        <FormattedDate
          weekday={today ? undefined : 'long'}
          month={today ? undefined : 'numeric'} day={today ? undefined : 'numeric'} hour='numeric' minute='numeric'
          value={this.props.booking.from}/> {' '}
        to{' '}
        <FormattedDate
          weekday={sameDay ? undefined : 'long'} month={sameDay ? undefined : 'numeric'}
          day={sameDay ? undefined : 'numeric'} hour='numeric' minute='numeric' value={this.props.booking.to}/> {' '}
      </div>
      {this.renderActions()}
    </div>
  }

  render () {
    const query = this.props.offsetDate ? '?offsetDate=' + this.props.offsetDate : ''
    return <div id='ActiveBooking' className={this.props.booking ? '' : 'no_booking'}>
      <Link
        to={`/laundries/${this.props.laundry.id}/timetable${query}`}>
        <svg className='close'>
          <use xlinkHref='#CloseX'/>
        </svg>
      </Link>
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
  currentUser: React.PropTypes.string,
  offsetDate: React.PropTypes.string,
  laundry: React.PropTypes.object,
  booking: React.PropTypes.object,
  machines: React.PropTypes.object,
  users: React.PropTypes.object
}

const diffDates = (d1, d2) => {
  var oneDay = 24 * 60 * 60 * 1000
  var t1 = new Date(d1.getTime()).setHours(0, 0, 0, 0)
  var t2 = new Date(d2.getTime()).setHours(0, 0, 0, 0)
  return Math.round((t2 - t1) / (oneDay))
}

class Timetable extends React.Component {

  constructor (props) {
    super(props)
    this.state = {numDays: 0, loading: true, offset: 0, hoverColumn: -1, activeBooking: null}
    this.handleResize = () => this.setState({numDays: this.numDays})
    this.hoverColumn = (hoverColumn) => this.setState({hoverColumn})
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

  componentWillReceiveProps ({laundry: {machines}}) {
    if (machines.length === this.props.laundry.machines.length) return
    this.setState({numDays: this.calculateNumDays(machines.length)})
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
  }

  get numDays () {
    return this.calculateNumDays(this.props.laundry.machines.length)
  }

  calculateNumDays (numMachines) {
    if (!this._mainRef) return 0
    return Math.min(Math.max(Math.floor(this._mainRef.offsetWidth / (numMachines * 100)), 1), 7)
  }

  get offsetDays () {
    const offsetTime = parseInt(this.props.offsetDate)
    if (isNaN(offsetTime)) return 0
    return Math.max(0, diffDates(new Date(), new Date(offsetTime)))
  }

  get days () {
    const startDay = new Date()
    startDay.setHours(0, 0, 0, 0)
    const offset = this.offsetDays
    return lodash.range(offset, offset + this.state.numDays).map((i) => {
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
    return <main id='TimeTableMain' ref={refPuller}>
      <div className={this.state.loading ? 'loading blur' : ''}>
        <TimetableHeaders
          hoverColumn={this.state.hoverColumn}
          laundry={this.props.laundry} dates={days} machines={this.props.machines}/>
        <TimetableTables
          currentUser={this.props.currentUser}
          activeBooking={this.props.activeBooking}
          offsetDate={this.props.offsetDate}
          onHoverColumn={this.hoverColumn}
          bookings={this.props.bookings}
          laundry={this.props.laundry} dates={days} machines={this.props.machines}/>
        <BookingInfo
          currentUser={this.props.currentUser}
          users={this.props.users}
          laundry={this.props.laundry}
          offsetDate={this.props.offsetDate}
          booking={this.props.bookings[this.props.activeBooking]}
          machines={this.props.machines}/>
      </div>
    </main>
  }
}

Timetable.propTypes = {
  currentUser: React.PropTypes.string,
  activeBooking: React.PropTypes.string,
  offsetDate: React.PropTypes.string,
  users: React.PropTypes.object,
  machines: React.PropTypes.object,
  bookings: React.PropTypes.object,
  laundry: React.PropTypes.shape({
    id: React.PropTypes.string,
    name: React.PropTypes.string,
    machines: React.PropTypes.array
  })
}

class TimetableWrapper extends React.Component {
  renderEmpty () {
    return <main className='naved'>
      <h1 className='alignLeft'>There are no machines registered</h1>
      {this.isOwner ? <section>
        Please register your machines <Link to={'/laundries/' + this.props.laundry.id + '/machines'}>here</Link>.
      </section> : <section>
        Please tell your landlord to register some machines.
      </section>}
    </main>
  }

  get isOwner () {
    return this.props.laundry.owners.indexOf(this.props.currentUser) >= 0
  }

  renderTables () {
    return <Timetable
      users={this.props.users}
      currentUser={this.props.currentUser}
      activeBooking={this.props.activeBooking}
      offsetDate={this.props.offsetDate}
      machines={this.props.machines}
      bookings={this.props.bookings}
      laundry={this.props.laundry}
    />
  }

  render () {
    return <DocumentTitle title='Timetable'>
      {this.props.laundry.machines.length ? this.renderTables() : this.renderEmpty()}
    </DocumentTitle>
  }
}

TimetableWrapper.propTypes = Timetable.propTypes

module.exports = TimetableWrapper
