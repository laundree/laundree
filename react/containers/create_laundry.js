/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const CreateLaundry = require('../views').CreateLaundry

const mapStateToProps = (store) => {
  return {}
}

module.exports = connect(mapStateToProps)(CreateLaundry)
