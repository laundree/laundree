/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const LaundrySettings = require('../views/LaundrySettings')

const mapStateToProps = ({users, currentUser, laundries, config: {locale, googleApiKey}}, {match: {params: {laundryId}}}) => {
  return {
    user: users[currentUser],
    laundries,
    currentLaundry: laundryId,
    locale,
    googleApiKey
  }
}

module.exports = connect(mapStateToProps)(LaundrySettings)
