/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const Machines = require('../views/Machines')

const mapStateToProps = ({users, currentUser, laundries, machines}, {match: {params: {laundryId}}}) => {
  return {
    user: users[currentUser],
    laundries,
    machines,
    currentLaundry: laundryId
  }
}

module.exports = connect(mapStateToProps)(Machines)
