/**
 * Created by budde on 27/04/16.
 */

var mongoose = require('mongoose')
var config = require('config')

mongoose.connect(config.get('mongo.url'))

module.exports = {
  UserModel: require('./user')
}
