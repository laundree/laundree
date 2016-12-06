const React = require('react')
const {FormattedDate} = require('react-intl')
const {Link} = require('react-router')
const {Modal, DocumentTitle} = require('./intl')
const sdk = require('../../client/sdk')
const {FormattedMessage} = require('react-intl')

class Booking extends React.Component {

  constructor (props) {
    super(props)
    this.state = {showModal: false}
    this.onCloseModal = () => this.setState({showModal: false})
    this.onDeleteModal = () => sdk.booking(this.props.booking.id).del()
    this.onDeleteClick = () => this.setState({showModal: true})
  }

  render () {
    const booking = this.props.booking
    const machine = this.props.machines[booking.machine]
    const fromDate = new Date(booking.from)
    const toDate = new Date(booking.to)
    const sameDay = new Date(fromDate.getTime()).setHours(0, 0, 0, 0) === new Date(toDate.getTime()).setHours(0, 0, 0, 0)
    const today = new Date().setHours(0, 0, 0, 0) === new Date(fromDate.getTime()).setHours(0, 0, 0, 0)
    return <div>
      <Modal
        show={this.state.showModal}
        message='bookings.modal.delete-booking'
        onClose={this.onCloseModal}
        actions={[
          {label: 'general.delete', className: 'delete red', action: this.onDeleteModal},
          {label: 'general.cancel', className: 'cancel', action: this.onCloseModal}]}
      />
      <div className='machineName'>
        <Link
          to={`/laundries/${this.props.currentLaundry}/timetable?offsetDate=${fromDate.getTime()}&activeBooking=${booking.id}`}>
          {machine ? machine.name : null}
        </Link>
      </div>
      <div className='time_action_wrapper'>
        <div className='time'>
          <svg>
            <use xlinkHref='#Time'/>
          </svg>
          <FormattedDate
            weekday={today ? undefined : 'long'}
            month={today ? undefined : 'numeric'} day={today ? undefined : 'numeric'} hour='numeric' minute='numeric'
            value={booking.from}/>
          <FormattedDate
            weekday={sameDay ? undefined : 'long'} month={sameDay ? undefined : 'numeric'}
            day={sameDay ? undefined : 'numeric'} hour='numeric' minute='numeric'
            value={booking.to}/>
        </div>
        <svg className='trash' onClick={this.onDeleteClick}>
          <use xlinkHref='#Trash'/>
        </svg>
      </div>
    </div>
  }

}

Booking.propTypes = {
  currentLaundry: React.PropTypes.string.isRequired,
  machines: React.PropTypes.object.isRequired,
  booking: React.PropTypes.shape({
    id: React.PropTypes.Sting,
    from: React.PropTypes.string,
    to: React.PropTypes.string,
    machine: React.PropTypes.string
  }).isRequired
}

class Bookings extends React.Component {

  constructor (props) {
    super(props)
    this.state = {showModal: false, loading: true}
    this.onCloseModal = () => this.setState({showModal: false})
  }

  componentDidMount () {
    sdk.listBookingsForUser(this.props.currentLaundry, this.props.user.id, {to: {$gte: new Date()}})
    sdk.listMachines(this.props.currentLaundry)
  }

  renderBookings () {
    if (!this.props.userBookings) return <div className='loading blur'/>
    if (!this.props.userBookings.length) {
      return <div className='empty_list'>
        <FormattedMessage id='bookings.no-bookings'/>
      </div>
    }
    return <ul>{this.props.userBookings
      .map((id) => this.props.bookings[id])
      .map((booking) => <li key={booking.id}><Booking
        machines={this.props.machines}
        booking={booking} currentLaundry={this.props.currentLaundry}/></li>)}</ul>
  }

  render () {
    return <DocumentTitle title='document-title.bookings'>
      <main className='naved'>
        <h1 className='alignLeft'>
          <FormattedMessage id='bookings.title'/>
        </h1>
        <section id='BookingList'>
          {this.renderBookings()}
        </section>
      </main>
    </DocumentTitle>
  }
}

Bookings.propTypes = {
  currentLaundry: React.PropTypes.string.isRequired,
  user: React.PropTypes.object.isRequired,
  userBookings: React.PropTypes.arrayOf(React.PropTypes.string),
  bookings: React.PropTypes.object.isRequired,
  machines: React.PropTypes.object.isRequired
}

module.exports = Bookings
