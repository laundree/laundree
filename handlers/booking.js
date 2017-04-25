/**
 * Created by budde on 09/06/16.
 */

const Handler = require('./handler')
const {BookingModel} = require('../models')
const {types: {DELETE_BOOKING, UPDATE_BOOKING, CREATE_BOOKING}} = require('../redux/actions')
const {createNotification, deleteNotification} = require('../utils/oneSignal')
const {logError} = require('../utils/error')

class BookingHandler extends Handler {
  /**
   * Create a new booking
   * @param {MachineHandler} machine
   * @param {UserHandler} owner
   * @param {Date} from
   * @param {Date} to
   * @returns {Promise.<BookingHandler>}
   */
  static async _createBooking (machine, owner, from, to) {
    const model = await new BookingModel({
      docVersion: 1,
      laundry: machine.model.laundry,
      machine: machine.model._id,
      owner: owner.model._id,
      from,
      to
    }).save()
    const booking = new BookingHandler(model)
    booking.emitEvent('create')
    booking._createNotification(owner.model.oneSignalPlayerIds).catch(logError)
    return booking
  }

  async _updateNotification (playerIds) {
    await this._cancelNotification()
    await this._createNotification(playerIds)
  }

  async _createNotification (playerIds) {
    if (!playerIds.length) {
      return
    }
    const newTime = new Date(this.model.from.getTime() - 1000 * 60 * 30)
    if (newTime.getTime() < Date.now()) {
      return
    }
    this.model.oneSignalId = await createNotification(playerIds, newTime)
    return this.model.save()
  }

  async _cancelNotification () {
    if (!this.model.oneSignalId) {
      return
    }
    if (this.model.from.getTime() - Date.now() < 30 * 60 * 1000) {
      return
    }
    return deleteNotification(this.model.oneSignalId)
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

  fetchLaundry () {
    const LaundryHandler = require('./laundry')
    return LaundryHandler
      .find({_id: this.model.laundry})
      .then(([laundry]) => laundry)
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

  async deleteBooking () {
    this._cancelNotification().catch(logError)
    await this.model.remove()
    this.emitEvent('delete')
    return this
  }

  /**
   * @param {UserHandler} owner
   * @param {Date} from
   * @param {Date} to
   */
  async updateTime (owner, from, to) {
    const notificationsShouldBeUpdated = from.getTime() !== this.model.from.getTime()
    if (notificationsShouldBeUpdated) {
      this._cancelNotification().catch(logError)
    }
    this.model.from = from
    this.model.to = to
    await this.model.save()
    if (notificationsShouldBeUpdated) {
      this._createNotification(owner.model.oneSignalPlayerIds).catch(logError)
    }
    this.emitEvent('update')
    return this
  }

  /**
   * Delete multiple bookings without emitting events
   * @param query
   * @returns {Promise}
   */
  static async deleteBookings (query = {}) {
    const bookings = await BookingHandler.find(query)
    return Promise.all(bookings.map(booking => booking.deleteBooking()))
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

  /**
   * Array of update actions
   * @returns {(function (handler: Handler) : Promise.<Handler>)[]}
   */
  get updateActions () {
    return [
      (booking) => {
        const MachineHandler = require('./machine')
        return MachineHandler
          .find({_id: booking.model.machine})
          .then(([machine]) => {
            booking.model.laundry = machine.model.laundry
            booking.model.docVersion = 1
            return booking.model.save().then((model) => new BookingHandler(model))
          })
      }
    ]
  }

  /**
   * Create an event from the booking
   * @returns {{start: Date, end: Date, uid, timestamp}}
   */
  get event () {
    return {
      start: this.model.from,
      end: this.model.to,
      uid: this.model.id,
      timestamp: this.model.createdAt
    }
  }

  toRest () {
    return this
      .fetchLaundry()
      .then(laundry => ({
        id: this.model.id,
        href: this.restUrl,
        from: laundry.dateToObject(this.model.from),
        to: laundry.dateToObject(this.model.to.toISOString())
      }))
  }

  get reduxModel () {
    return {
      id: this.model.id,
      from: this.model.from,
      to: this.model.to,
      machine: this.model.machine.toString(),
      owner: this.model.owner.toString()
    }
  }
}

Handler.setupHandler(BookingHandler, BookingModel, {
  delete: DELETE_BOOKING,
  update: UPDATE_BOOKING,
  create: CREATE_BOOKING
})

module.exports = BookingHandler
