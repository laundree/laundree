/**
 * Created by budde on 09/06/16.
 */

const Handler = require('./handler')
const {BookingModel} = require('../models')
const EventEmitter = require('events')
const {linkEmitter} = require('../lib/redis')

const pubStaticEmitter = new EventEmitter()
const subStaticEmitter = new EventEmitter()

linkEmitter(
  subStaticEmitter,
  pubStaticEmitter,
  'booking',
  ['update', 'create'],
  (machine) => Promise.resolve(machine.model.id),
  (id) => BookingHandler.findFromId(id))

linkEmitter(
  subStaticEmitter,
  pubStaticEmitter,
  'booking',
  ['delete'],
  (machine) => Promise.resolve(machine.model.id),
  (id) => Promise.resolve(id))

class BookingHandler extends Handler {

  static on () {
    return Handler._on(pubStaticEmitter, arguments)
  }

  static removeListener () {
    return Handler._removeListener(pubStaticEmitter, arguments)
  }

  static findFromId (id) {
    return Handler._findFromId(BookingModel, BookingHandler, id)
  }

  static find (filter, options) {
    return Handler._find(BookingModel, BookingHandler, filter, options)
  }

  /**
   * Create a new booking
   * @param {MachineHandler} machine
   * @param {UserHandler} owner
   * @param {Date} from
   * @param {Date} to
   * @returns {Promise.<BookingHandler>}
   */
  static _createBooking (machine, owner, from, to) {
    return new BookingModel({machine: machine.model._id, owner: owner.model._id, from, to})
      .save()
      .then((model) => new BookingHandler(model))
      .then((booking) => {
        booking.emitEvent('create')
        return booking
      })
  }

  /**
   * Fetch machine
   * @return {Promise.<MachineHandler>}
   */
  fetchMachine () {
    const MachineHandler = require('./machine')
    return MachineHandler
      .find({_id: this.model.machine})
      .then(([machine]) => machine)
  }

  /**
   * Checks if provided user is owner
   * @param {UserHandler} user
   * @return {boolean}
   */
  isOwner (user) {
    const owner = this.model.populated('owner') || this.model.owner
    return user.model._id.equals(owner)
  }

  deleteBooking () {
    return this.model.remove().then(() => this)
  }

  toRestSummary () {
    return {id: this.model.id, href: this.restUrl}
  }

  get restUrl () {
    return `/api/bookings/${this.model.id}`
  }

  emitEvent (event) {
    return this._emitEvent(subStaticEmitter, event)
  }

  toRest () {
    return Promise.resolve({
      id: this.model.id,
      href: this.restUrl,
      from: this.model.from.toISOString(),
      to: this.model.to.toISOString()
    })
  }
}

module.exports = BookingHandler
