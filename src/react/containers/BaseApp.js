/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const BaseApp = require('../views/BaseApp')

const mapStateToProps = ({users, currentUser, laundries, config}, {location, match: {params: {laundryId}}}) => {
  return {
    config,
    location,
    user: users[currentUser],
    laundries,
    currentLaundry: laundryId
  }
}

module.exports = connect(mapStateToProps)(BaseApp)
