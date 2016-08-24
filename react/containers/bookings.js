/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const Bookings = require('../views').Bookings

const mapStateToProps = ({
  users, laundries, machines,
  currentUser, bookings, userBookings
},
  {params: {id}}) => {
  return {
    user: users[currentUser],
    laundries,
    machines,
    bookings,
    userBookings: userBookings ? userBookings.bookings : null,
    currentLaundry: id
  }
}

module.exports = connect(mapStateToProps)(Bookings)
