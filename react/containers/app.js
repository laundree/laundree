/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {App} = require('../views')

const mapStateToProps = ({users, currentUser, laundries, locale}, {params: {laundryId}}) => {
  return {
    locale,
    user: users[currentUser],
    laundries,
    currentLaundry: laundryId
  }
}

module.exports = connect(mapStateToProps)(App)
