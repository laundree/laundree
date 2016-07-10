const React = require('react')

class Bookings extends React.Component {
  componentDidMount () {
    this.context.actions.listBookingsForUser(this.props.currentLaundry, this.props.user.id, {to: {$gte: new Date()}})
  }

  render () {
    return <main className='naved'>
      <h1 className='alignLeft'>Your bookings</h1>
      <ul>
        {this.props.userBookings.map((id) => this.props.bookings[id]).map((booking) => <li key={booking.id}>{booking.id}</li>)}
      </ul>
    </main>
  }
}

Bookings.contextTypes = {
  actions: React.PropTypes.shape({
    listBookingsForUser: React.PropTypes.func
  })
}

Bookings.propTypes = {
  currentLaundry: React.PropTypes.string.isRequired,
  user: React.PropTypes.object.isRequired,
  userBookings: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  bookings: React.PropTypes.object.isRequired
}

module.exports = Bookings
