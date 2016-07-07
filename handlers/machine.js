/**
 * Created by budde on 09/06/16.
 */

const Handler = require('./handler')
const {MachineModel} = require('../models')
const BookingHandler = require('./booking')
const EventEmitter = require('events')
const {linkEmitter} = require('../lib/redis')

const pubStaticEmitter = new EventEmitter()
const subStaticEmitter = new EventEmitter()

linkEmitter(
  subStaticEmitter,
  pubStaticEmitter,
  'machine',
  ['update', 'create'],
  (machine) => Promise.resolve(machine.model.id),
  (id) => MachineHandler.findFromId(id))

linkEmitter(
  subStaticEmitter,
  pubStaticEmitter,
  'machine',
  ['delete'],
  (machine) => Promise.resolve(machine.model.id),
  (id) => Promise.resolve(id))

class MachineHandler extends Handler {

  static on () {
    return Handler._on(pubStaticEmitter, arguments)
  }

  static removeListener () {
    return Handler._removeListener(pubStaticEmitter, arguments)
  }

  static find (filter, options) {
    return this._find(MachineModel, MachineHandler, filter, options)
  }

  static findFromId (id) {
    return this._findFromId(MachineModel, MachineHandler, id)
  }

  /**
   * Create a new machine
   * @param {LaundryHandler} laundry
   * @param {string} name
   * @param {string} type
   * @returns {Promise.<MachineHandler>}
   */
  static _createMachine (laundry, name, type) {
    const model = new MachineModel({laundry: laundry.model._id, name, type})
    return model.save()
      .then((model) => new MachineHandler(model))
      .then((machine) => {
        machine.emitEvent('create')
        return machine
      })
  }

  emitEvent (event) {
    return this._emitEvent(subStaticEmitter, event)
  }

  /**
   * Create a new booking
   * @param {UserHandler} owner
   * @param {Date} from
   * @param {Date} to
   * @return {Promise.<BookingHandler>}
   */
  createBooking (owner, from, to) {
    return BookingHandler._createBooking(this, owner, from, to)
  }

  fetchLaundry () {
    const LaundryHandler = require('./laundry')
    return LaundryHandler.find({_id: this.model.laundry}).then(([laundry]) => laundry)
  }

  update ({name, type}) {
    if (name) this.model.name = name
    if (type) this.model.type = type
    return this.model.save().then(() => {
      this.emitEvent('update')
      return this
    })
  }

  /**
   * Fetch bookings for machine.
   * Finds any booking with start before to and end after from
   * @param {Date} from
   * @param {Date} to
   * @return {BookingHandler[]}
   */
  fetchBookings (from, to) {
    return BookingHandler._fetchBookings(from, to, [this.model._id])
  }

  _deleteMachine () {
    return BookingHandler
      .find({machine: this.model._id})
      .then((bookings) => Promise
        .all(bookings.map((booking) => booking.deleteBooking())))
      .then(() => this.model.remove())
      .then(() => {
        this.emitEvent('delete')
        return this
      })
  }

  get restUrl () {
    return `/machines/${this.model.id}`
  }

  toRestSummary () {
    return {name: this.model.name, href: this.restUrl, id: this.model.id}
  }

  toRest () {
    return Promise.resolve({name: this.model.name, href: this.restUrl, id: this.model.id, type: this.model.type})
  }

}

module.exports = MachineHandler
