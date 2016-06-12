/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {LogIn} = require('../views')
const lodash = require('lodash')

const mapStateToProps = (store) => {
  return {flash: lodash.cloneDeep(store.flash)}
}

module.exports = connect(mapStateToProps)(LogIn)
