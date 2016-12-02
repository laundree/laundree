/**
 * Created by budde on 28/05/16.
 */
const React = require('react')
const {DocumentTitle} = require('./intl')
const TimetableTables = require('./timetable_tables.jsx')
const TimetableHeaders = require('./timetable_headers.jsx')
const {Link} = require('react-router')
const {FormattedDate, FormattedMessage} = require('react-intl')
const {range} = require('../../utils/array')
const sdk = require('../../client/sdk')
const moment = require('moment-timezone')
const BaseModal = require('./base_modal.jsx')

class BookingInfo extends React.Component {

  constructor (props) {
    super(props)
    this.deleteHandler = () => sdk
      .booking(this.props.booking.id)
      .del()
      .then(() => this.close())
    this.closeHandler = () => this.close()
  }

  renderActions () {
    return <div className='buttonContainer'>
      {this.isOwner
        ? <button className='red' onClick={this.deleteHandler}>Delete booking</button>
        : null }
      <button onClick={this.closeHandler}>Close</button>
    </div>
  }

  get isOwner () {
    return this.props.booking.owner === this.props.currentUser || this.props.laundry.owners.indexOf(this.props.currentUser) >= 0
  }

  renderBooking () {
    const booking = this.props.booking
    if (!booking) return null
    const owner = this.props.users[booking.owner]
    const fromDate = new Date(booking.from)
    const toDate = new Date(booking.to)
    const sameDay = new Date(fromDate.getTime()).setHours(0, 0, 0, 0) === new Date(toDate.getTime()).setHours(0, 0, 0, 0)
    const today = new Date().setHours(0, 0, 0, 0) === new Date(fromDate.getTime()).setHours(0, 0, 0, 0)
    return <div id='ActiveBooking'>
      <img src={owner.photo} className='avatar'/>
      <div className='text'>
        {owner.id === this.props.currentUser ? 'You have' : `${owner.displayName} has`} booked{' '}
        <i>{this.props.machines[this.props.booking.machine].name}</i> from{' '}
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

  close () {
    this.props.onActiveChange(null)
  }

  render () {
    return <BaseModal
      onClose={this.closeHandler}
      show={Boolean(this.props.booking)}>
      {this.renderBooking()}
    </BaseModal>
  }
}

BookingInfo.propTypes = {
  onActiveChange: React.PropTypes.func,
  currentUser: React.PropTypes.string,
  offsetDate: React.PropTypes.string,
  laundry: React.PropTypes.object,
  booking: React.PropTypes.object,
  machines: React.PropTypes.object,
  users: React.PropTypes.object
}

class Timetable extends React.Component {

  constructor (props) {
    super(props)
    this.state = {numDays: 0, loading: true, offset: 0, hoverColumn: -1, activeBooking: null}
    this.handleResize = () => this.setState({numDays: this.numDays})
    this.hoverColumn = (hoverColumn) => this.setState({hoverColumn})
    this.onActiveChange = (bookingId) => this.setState({activeBooking: bookingId})
  }

  componentDidMount () {
    sdk.listMachinesAndUsers(this.props.laundry.id)
    window.addEventListener('resize', this.handleResize)
    const numDays = this.numDays
    this.setState({numDays})
  }

  componentWillReceiveProps ({laundry: {machines: machineIds}, machines}) {
    if (machineIds.length !== this.props.laundry.machines.length) this.setState({numDays: this.calculateNumDays(machines.length)})
    if (!this._mainRef || machineIds.map(id => machines[id]).filter(m => m).length !== machineIds.length) return
    this.setState({loading: false})
    if (!this._mainRef.offsetHeight || this.state.scrolledToNav) return
    const now = this._mainRef.querySelector('#TimeTable .now')
    this.setState({scrolledToNav: true})
    if (!now) return
    now.scrollIntoView()
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
  }

  get numDays () {
    return this.calculateNumDays(this.props.laundry.machines.length)
  }

  calculateNumDays (numMachines) {
    if (!this._mainRef) return 0
    return Math.min(Math.max(Math.floor(this._mainRef.offsetWidth / (Math.max(numMachines * 100, 200))), 1), 7)
  }

  get days () {
    const startDay = this.props.offsetDate
      ? moment.tz(this.props.offsetDate, this.props.laundry.timezone)
      : moment.tz(moment.tz(this.props.laundry.timezone).format('YYYY-MM-DD'), this.props.laundry.timezone)
    return range(this.state.numDays).map(i => startDay.clone().add(i, 'd'))
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
          onActiveChange={this.onActiveChange}
          currentUser={this.props.currentUser}
          activeBooking={this.state.activeBooking}
          offsetDate={this.props.offsetDate}
          onHoverColumn={this.hoverColumn}
          bookings={this.props.bookings}
          laundry={this.props.laundry} dates={days} machines={this.props.machines}/>

        <BookingInfo
          onActiveChange={this.onActiveChange}
          currentUser={this.props.currentUser}
          users={this.props.users}
          laundry={this.props.laundry}
          offsetDate={this.props.offsetDate}
          booking={this.props.bookings[this.state.activeBooking]}
          machines={this.props.machines}/>
      </div>
    </main>
  }
}

Timetable.propTypes = {
  currentUser: React.PropTypes.string,
  offsetDate: React.PropTypes.string,
  users: React.PropTypes.object,
  machines: React.PropTypes.object,
  bookings: React.PropTypes.object,
  laundry: React.PropTypes.shape({
    id: React.PropTypes.string,
    name: React.PropTypes.string,
    machines: React.PropTypes.array,
    timezone: React.PropTypes.string
  })
}

class TimetableWrapper extends React.Component {
  renderEmpty () {
    return <main className='naved'>
      <h1 className='alignLeft'>
        <FormattedMessage id='timetable.no-machines.title'/>
      </h1>
      {this.isOwner ? <section>
        <FormattedMessage
          id='timetable.no-machines.action.register'
          values={{
            link: <Link to={'/laundries/' + this.props.laundry.id + '/machines'}>
              <FormattedMessage id='timetable.no-machines.action.register.link'/>
            </Link>
          }}/>
      </section> : <section>
        <FormattedMessage id='timetable.no-machines.action.wait'/>
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
    if (!this.props.laundry) return null
    return <DocumentTitle title='document-title.timetable'>
      {this.props.laundry.machines.length ? this.renderTables() : this.renderEmpty()}
    </DocumentTitle>
  }
}

TimetableWrapper.propTypes = Timetable.propTypes

module.exports = TimetableWrapper
