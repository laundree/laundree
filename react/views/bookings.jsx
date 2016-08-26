const React = require('react')
const {FormattedDate} = require('react-intl')
const {Link} = require('react-router')
const DocumentTitle = require('react-document-title')
const Modal = require('./modal.jsx')

class Bookings extends React.Component {

  constructor (props) {
    super(props)
    this.state = {showModal: false}
    this.onCloseModal = () => this.setState({showModal: false})
  }

  deleteModalGenerator (booking) {
    return () => this.context.actions.deleteBooking(booking.id).then(() => this.setState({showModal: false}))
  }

  componentDidMount () {
    this.context.actions
      .listBookingsForUser(this.props.currentLaundry, this.props.user.id, {to: {$gte: new Date()}})
  }

  _row (booking) {
    const deleteHandler = () => this.setState({showModal: true})
    const fromDate = new Date(booking.from)
    const toDate = new Date(booking.to)
    const sameDay = new Date(fromDate.getTime()).setHours(0, 0, 0, 0) === new Date(toDate.getTime()).setHours(0, 0, 0, 0)
    const today = new Date().setHours(0, 0, 0, 0) === new Date(fromDate.getTime()).setHours(0, 0, 0, 0)
    return <div>
      <Modal
        show={this.state.showModal}
        message='Are you sure that you want to delete this booking?'
        onClose={this.onCloseModal}
        actions={[
          {label: 'Delete', className: 'delete red', action: this.deleteModalGenerator(booking)},
          {label: 'Cancel', className: 'cancel', action: this.onCloseModal}]}
      />
      <div className='name'>
        <Link
          to={`/laundries/${this.props.currentLaundry}/timetable?offsetDate=${fromDate.getTime()}&activeBooking=${booking.id}`}>
          {this.props.machines[booking.machine].name}
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
        <svg className='trash' onClick={deleteHandler}>
          <use xlinkHref='#Trash'/>
        </svg>
      </div>
    </div>
  }

  renderBookings () {
    if (!this.props.userBookings) return <div className='loading blur'/>
    if (!this.props.userBookings.length) return <div className='empty_list'><span>You have no bookings.</span></div>
    return <ul>{this.props.userBookings
      .map((id) => this.props.bookings[id])
      .map((booking) => <li key={booking.id}>{this._row(booking)}</li>)}</ul>
  }

  render () {
    return <DocumentTitle title='Bookings'>
      <main className='naved'>
        <h1 className='alignLeft'>Your bookings</h1>
        <section id='BookingList'>
          {this.renderBookings()}
        </section>
      </main>
    </DocumentTitle>
  }
}

Bookings.contextTypes = {
  actions: React.PropTypes.shape({
    listBookingsForUser: React.PropTypes.func,
    deleteBooking: React.PropTypes.func
  })
}

Bookings.propTypes = {
  currentLaundry: React.PropTypes.string.isRequired,
  user: React.PropTypes.object.isRequired,
  userBookings: React.PropTypes.arrayOf(React.PropTypes.string),
  bookings: React.PropTypes.object.isRequired,
  machines: React.PropTypes.object.isRequired
}

module.exports = Bookings
