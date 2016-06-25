/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {LeftNav} = require('../views')
const lodash = require('lodash')

const mapStateToProps = (store, {params: {id}}) => {
  return {
    laundries: lodash.cloneDeep(store.laundries),
    currentLaundry: id
  }
}

module.exports = connect(mapStateToProps)(LeftNav)
