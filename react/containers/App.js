/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const App = require('../views/App')

const mapStateToProps = ({users, currentUser, laundries, config}, {location, params: {laundryId}}) => {
  return {
    config,
    location,
    user: users[currentUser],
    laundries,
    currentLaundry: laundryId
  }
}

module.exports = connect(mapStateToProps)(App)
