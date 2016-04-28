/**
 * Created by budde on 27/04/16.
 */

var mongoose = require('mongoose')
var config = require('../config')

mongoose.connect(config.mongo.url)

module.exports = {
  UserModel: require('./user')
}
