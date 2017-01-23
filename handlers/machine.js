/**
 * Created by budde on 09/06/16.
 */

const Handler = require('./handler')
const {MachineModel} = require('../models')
const BookingHandler = require('./booking')

const {types: {DELETE_MACHINE, UPDATE_MACHINE, CREATE_MACHINE}} = require('../redux/actions')

class MachineHandler extends Handler {

  /**
   * Create a new machine
   * @param {LaundryHandler} laundry
   * @param {string} name
   * @param {string} type
   * @returns {Promise.<MachineHandler>}
   */
  static _createMachine (laundry, name, type, broken) {
    const model = new MachineModel({laundry: laundry.model._id, name, type, broken})
    return model.save()
      .then((model) => new MachineHandler(model))
      .then((machine) => {
        machine.emitEvent('create')
        return machine
      })
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

  update ({name, type, broken}) {
    if (name) this.model.name = name
    if (type) this.model.type = type
    if (broken !== undefined) this.model.broken = broken
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

  /**
   * Lists bookings as events
   * @returns {Promise.<{start: Date, end: Date, uid: string, timestamp: Date, summary: string}[]>}
   */
  generateEvents () {
    return BookingHandler.find({machine: this.model._id})
      .then(bookings => bookings.map(booking => booking.event))
      .then(bookings => bookings.map(({start, end, uid, timestamp}) => ({
        start,
        end,
        uid,
        timestamp,
        summary: this.model.name
      })))
  }

  get restUrl () {
    return `/machines/${this.model.id}`
  }

  toRestSummary () {
    return {name: this.model.name, href: this.restUrl, id: this.model.id}
  }

  toRest () {
    return Promise.resolve({name: this.model.name, href: this.restUrl, id: this.model.id, type: this.model.type, broken: this.model.broken})
  }

  get reduxModel () {
    return {
      id: this.model.id,
      type: this.model.type,
      name: this.model.name,
      broken: this.model.broken
    }
  }
}

Handler.setupHandler(MachineHandler, MachineModel, {
  delete: DELETE_MACHINE,
  update: UPDATE_MACHINE,
  create: CREATE_MACHINE
})

module.exports = MachineHandler
