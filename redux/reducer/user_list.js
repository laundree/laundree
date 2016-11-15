/**
 * Created by budde on 13/11/2016.
 */

const {setupList} = require('./list')
const {types: {LIST_USERS}} = require('../actions')

module.exports = setupList(LIST_USERS)
