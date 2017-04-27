/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const CreateLaundry = require('../views/CreateLaundry')

const mapStateToProps = ({users, currentUser, config: {googleApiKey, locale}}) => {
  return {user: users[currentUser], googleApiKey, locale}
}

module.exports = connect(mapStateToProps)(CreateLaundry)
