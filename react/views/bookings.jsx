const React = require('react')
const {FormattedDate} = require('react-intl')
const {Link} = require('react-router')

class Bookings extends React.Component {

  componentDidMount () {
    this.context.actions
      .listBookingsForUser(this.props.currentLaundry, this.props.user.id, {to: {$gte: new Date()}})
  }

  _row (booking) {
    const deleteHandler = () => this.context.actions.deleteBooking(booking.id)
    const fromDate = new Date(booking.from)
    const toDate = new Date(booking.to)
    const sameDay = new Date(fromDate.getTime()).setHours(0, 0, 0, 0) === new Date(toDate.getTime()).setHours(0, 0, 0, 0)
    const today = new Date().setHours(0, 0, 0, 0) === new Date(fromDate.getTime()).setHours(0, 0, 0, 0)
    return <div>
      <div className='machine_name'>
        <Link
          to={`/laundries/${this.props.currentLaundry}/timetable?offsetDate=${fromDate.getTime()}&activeBooking=${booking.id}`}>
          {this.props.machines[booking.machine].name}
        </Link>
      </div>
      <svg className='trash' onClick={deleteHandler}>
        <use xlinkHref='#Trash'/>
      </svg>
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
    </div>
  }

  renderBookings () {
    if (!this.props.userBookings.length) return <div className='empty_list'><span>You have no bookings.</span></div>
    return <ul>{this.props.userBookings
      .map((id) => this.props.bookings[id])
      .map((booking) => <li key={booking.id}>{this._row(booking)}</li>)}</ul>
  }

  render () {
    return <main className='naved'>
      <h1 className='alignLeft'>Your bookings</h1>
      <section id='BookingList'>
        {this.renderBookings()}
      </section>
    </main>
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
  userBookings: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  bookings: React.PropTypes.object.isRequired,
  machines: React.PropTypes.object.isRequired
}

module.exports = Bookings
