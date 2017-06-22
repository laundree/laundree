// @flow

import mongoose from 'mongoose'
import config from 'config'
import Debug from 'debug'
const debug = Debug('laundree.models')

mongoose.Promise = Promise

export default function connectMongoose () {
  mongoose.connect(config.get('mongo.url'))

  mongoose.connection.on('connected', () => debug('Mongoose connected'))

  mongoose.connection.on('error', (err) => {
    debug('Mongoose connection erred: ', err)
    debug('Restarting in a moment...')
    setTimeout(() => mongoose.connect(config.get('mongo.url')), 1000)
  })

  mongoose.connection.on('disconnected', () => debug('Mongoose disconnected...'))

}
