/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const CreateLaundry = require('../views').CreateLaundry

const mapStateToProps = (store) => {
  return {user: store.users[store.currentUser]}
}

module.exports = connect(mapStateToProps)(CreateLaundry)
