/**
 * Created by budde on 09/06/16.
 */

const Handler = require('./handler')
const {BookingModel} = require('../models')

class BookingHandler extends Handler {

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

  static _fetchBookings (from, to, machineIds) {
    return BookingHandler.find({
      $or: [
        {
          machine: {$in: machineIds},
          from: {$lte: from},
          to: {$gt: from}
        },
        {
          machine: {$in: machineIds},
          from: {$lt: to},
          to: {$gte: to}
        },
        {
          machine: {$in: machineIds},
          from: {$gte: from},
          to: {$lte: to}
        }
      ]
    })
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
    return this.model.remove().then(() => {
      this.emitEvent('delete')
      return this
    })
  }

  /**
   * Find adjacent bookings
   * @param {UserHandler} user
   * @param {MachineHandler} machine
   * @param {Date} from
   * @param {Date} to
   * @return {Promise.<{before: BookingHandler=, after: BookingHandler=}>}
   */
  static findAdjacentBookingsOfUser (user, machine, from, to) {
    return Promise.all([
      BookingHandler.findBookingForUserAndMachine(user, machine, {to: from}, {limit: 1}),
      BookingHandler.findBookingForUserAndMachine(user, machine, {from: to}, {limit: 1})
    ])
      .then(([[before], [after]]) => ({before, after}))
  }

  /**
   * Find booking for user and machine
   * @param {UserHandler} user
   * @param {MachineHandler} machine
   * @param filter
   * @param options
   * @returns {Promise.<BookingHandler[]>}
   */
  static findBookingForUserAndMachine (user, machine, filter = {}, options = {}) {
    return BookingHandler.find(Object.assign({}, filter, {owner: user.model._id, machine: machine.model._id}), options)
  }

  toRestSummary () {
    return {id: this.model.id, href: this.restUrl}
  }

  get restUrl () {
    return `/api/bookings/${this.model.id}`
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

Handler.setupHandler(BookingHandler, BookingModel)

module.exports = BookingHandler
