/**
 * Created by budde on 05/06/16.
 */
const {combineReducers} = require('redux')

module.exports = combineReducers({
  users: require('./users'),
  userList: require('./user_list'),
  userListSize: require('./user_list_size'),
  currentUser: require('./current_user'),
  flash: require('./flash'),
  laundries: require('./laundries'),
  laundryList: require('./laundry_list'),
  laundryListSize: require('./laundry_list_size'),
  machines: require('./machines'),
  bookings: require('./bookings'),
  userBookings: require('./user_bookings'),
  invites: require('./laundry_invitations'),
  stats: require('./stats'),
  jobs: require('./jobs'),
  locale: require('./locale')
})
