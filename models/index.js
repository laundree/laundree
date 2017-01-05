/**
 * Created by budde on 27/04/16.
 */

const mongoose = require('mongoose')
const config = require('config')
const debug = require('debug')('laundree.models')

mongoose.connect(config.get('mongo.url'))
mongoose.Promise = Promise

mongoose.connection.on('connected', () => debug('Mongoose connected'))

mongoose.connection.on('error', (err) => {
  debug('Mongoose connection erred: ', err)
  debug('Restarting in a moment...')
  setTimeout(() => mongoose.connect(config.get('mongo.url')), 1000)
})

mongoose.connection.on('disconnected', () => debug('Mongoose disconnected...'))

module.exports = {
  EventModel: require('./event'),
  UserModel: require('./user'),
  TokenModel: require('./token'),
  LaundryModel: require('./laundry'),
  BookingModel: require('./booking'),
  MachineModel: require('./machine'),
  LaundryInvitationModel: require('./laundry_invitation')
}
