/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const LeftNav = require('../views/LeftNav')

const mapStateToProps = ({users, laundries, currentUser}, {match: {params: {laundryId}}}) => {
  return {
    laundries,
    currentLaundry: laundryId,
    user: users[currentUser]
  }
}

module.exports = connect(mapStateToProps)(LeftNav)
