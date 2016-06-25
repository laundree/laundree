/**
 * Created by budde on 28/05/16.
 */

const connect = require('react-redux').connect
const {Settings} = require('../views')
const lodash = require('lodash')

const mapStateToProps = (store, {params: {id}}) => {
  return {
    user: lodash.cloneDeep(store.users[store.currentUser]),
    laundries: lodash.cloneDeep(store.laundries),
    currentLaundry: id
  }
}

module.exports = connect(mapStateToProps)(Settings)
