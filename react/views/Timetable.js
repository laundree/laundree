/**
 * Created by budde on 28/05/16.
 */
const React = require('react')
const {DocumentTitle} = require('./intl')
const TimetableTables = require('./TimetableTables')
const TimetableHeaders = require('./TimetableHeaders')
const {Link} = require('react-router-dom')
const {FormattedDate, FormattedMessage} = require('react-intl')
const {range} = require('../../utils/array')
const sdk = require('../../client/sdk')
const moment = require('moment-timezone')
const {BaseModal} = require('./modal')
const Loader = require('./Loader')

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
    if (!this.isOwner) return null
    return <button className='red' onClick={this.deleteHandler}>
      <FormattedMessage id='general.delete-booking'/>
    </button>
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
        <FormattedMessage
          id={owner.id === this.props.currentUser
            ? 'timetable.modal.message.you-have'
            : 'timetable.modal.message.user-has'}
          values={{
            machine: <i>{this.props.machines[this.props.booking.machine].name}</i>,
            fromTime: <FormattedDate
              timeZone={this.props.laundry.timezone}
              weekday={today ? undefined : 'long'}
              month={today ? undefined : 'numeric'}
              day={today ? undefined : 'numeric'}
              hour='numeric'
              minute='numeric'
              value={this.props.booking.from}/>,
            toTime: <FormattedDate
              timeZone={this.props.laundry.timezone}
              weekday={sameDay ? undefined : 'long'}
              month={sameDay ? undefined : 'numeric'}
              day={sameDay ? undefined : 'numeric'}
              hour='numeric'
              minute='numeric'
              value={this.props.booking.to}/>,
            user: owner.displayName
          }}
        />
      </div>
      <div className='buttonContainer'>
        {this.renderActions()}
        <button onClick={this.closeHandler}>
          <FormattedMessage id='general.close'/>
        </button>
      </div>
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
    this.state = {numDays: 0, offset: 0, hoverColumn: -1, activeBooking: null}
  }

  handleResize () {
    this.setState({numDays: this.numDays})
  }

  componentDidMount () {
    window.addEventListener('resize', () => this.handleResize())
    const numDays = this.numDays
    this.setState({numDays})
  }

  componentWillReceiveProps ({laundry: {machines: machineIds}, machines}) {
    if (machineIds.length !== this.props.laundry.machines.length) this.setState({numDays: this.calculateNumDays(machines.length)})
    if (!this._mainRef || machineIds.map(id => machines[id]).filter(m => m).length !== machineIds.length) return
    if (!this._mainRef.offsetHeight || this.state.scrolledToNav) return
    const now = this._mainRef.querySelector('#TimeTable .now')
    this.setState({scrolledToNav: true})
    if (!now) return
    now.scrollIntoView()
  }

  componentWillUnmount () {
    window.removeEventListener('resize', () => this.handleResize())
  }

  get numDays () {
    return this.calculateNumDays(this.props.laundry.machines.length)
  }

  calculateNumDays (numMachines) {
    if (!this._mainRef) return 0
    return Math.min(Math.max(Math.floor(this._mainRef.offsetWidth / (Math.max(numMachines * 100, 200))), 1), 7)
  }

  get offsetDate () {
    return this.props.offsetDate && this.props.offsetDate.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/) && moment.tz(this.props.offsetDate, this.props.laundry.timezone).isValid()
      ? this.props.offsetDate
      : undefined
  }

  get days () {
    const startDay = this.offsetDate
      ? moment.tz(this.offsetDate, this.props.laundry.timezone)
      : moment.tz(moment.tz(this.props.laundry.timezone).format('YYYY-MM-DD'), this.props.laundry.timezone)
    return range(this.state.numDays).map(i => startDay.clone().add(i, 'd'))
  }

  render () {
    const refPuller = (ref) => {
      this._mainRef = ref
    }
    const days = this.days
    return <main id='TimeTableMain' ref={refPuller}>
      <TimetableHeaders
        hoverColumn={this.state.hoverColumn}
        laundry={this.props.laundry} dates={days} machines={this.props.machines}/>
      <TimetableTables
        onActiveChange={activeBooking => this.setState({activeBooking})}
        currentUser={this.props.currentUser}
        activeBooking={this.state.activeBooking}
        offsetDate={this.offsetDate}
        onHoverColumn={hoverColumn => this.setState({hoverColumn})}
        hoverColumn={this.state.hoverColumn}
        bookings={this.props.bookings}
        laundry={this.props.laundry} dates={days} machines={this.props.machines}/>
      <BookingInfo
        onActiveChange={activeBooking => this.setState({activeBooking})}
        currentUser={this.props.currentUser}
        users={this.props.users}
        laundry={this.props.laundry}
        offsetDate={this.offsetDate}
        booking={this.props.bookings[this.state.activeBooking]}
        machines={this.props.machines}/>
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

  load () {
    return sdk.listMachinesAndUsers(this.props.laundry.id)
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
    return <DocumentTitle title='document-title.timetable'>
      <Loader loader={() => this.load()}>
        {this.props.laundry.machines.length ? this.renderTables() : this.renderEmpty()}
      </Loader>
    </DocumentTitle>
  }
}

TimetableWrapper.propTypes = Timetable.propTypes

module.exports = TimetableWrapper
