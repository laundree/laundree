// @flow

import mongoose from 'mongoose'
import config from 'config'
import Debug from 'debug'
const debug = Debug('laundree.models')

mongoose.Promise = Promise

let started = false
const mongooseOptions = {
  useMongoClient: true
}

export default function connectMongoose () {
  if (started) {
    debug('Mongoose already connected...')
    return
  }
  started = true
  mongoose.connect(config.get('mongo.url'), mongooseOptions)

  mongoose.connection.on('connected', () => debug('Mongoose connected'))

  mongoose.connection.on('error', (err) => {
    debug('Mongoose connection erred: ', err)
    debug('Restarting in a moment...')
    setTimeout(() => mongoose.connect(config.get('mongo.url'), mongooseOptions), 1000)
  })

  mongoose.connection.on('disconnected', () => debug('Mongoose disconnected...'))

}
