/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const Machines = require('../views/Machines')

const mapStateToProps = (store, {params: {laundryId}}) => {
  return {
    user: store.users[store.currentUser],
    laundries: store.laundries,
    machines: store.machines,
    currentLaundry: laundryId
  }
}

module.exports = connect(mapStateToProps)(Machines)
