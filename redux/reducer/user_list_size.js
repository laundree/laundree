/**
 * Created by budde on 13/11/2016.
 */

const {setupSingleton} = require('./singleton')
const {types: {UPDATE_USER_LIST_SIZE}} = require('../actions')

module.exports = setupSingleton(UPDATE_USER_LIST_SIZE)
