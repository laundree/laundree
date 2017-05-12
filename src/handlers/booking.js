// @flow
import Handler from './handler'
import BookingModel from '../models/booking'
import MachineHandler from './machine'
import LaundryHandler from './laundry'
import { types } from '../redux/actions'
import type UserHandler from './user'
import type { ObjectId, QueryConditions, QueryOptions } from 'mongoose'
const {createNotification, deleteNotification} = require('../utils/oneSignal')
const {logError} = require('../utils/error')

export class BookingHandler extends Handler<BookingModel, BookingHandler, *, *, *> {
  restUrl: string

  static async find (filter: QueryConditions, options?: QueryOptions): Promise<BookingHandler[]> {
    return Handler._find(BookingModel, BookingHandler, filter, options)
  }

  constructor (model: BookingModel) {
    super(
      model,
      BookingHandler,
      m => new BookingHandler(m),
      {
        delete: types.DELETE_BOOKING,
        update: types.UPDATE_BOOKING,
        create: types.CREATE_BOOKING
      })
    this.restUrl = `/api/bookings/${this.model.id}`
  }

  /**
   * Create a new bookingm
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

  async _updateNotification (playerIds: string[]) {
    await this._cancelNotification()
    await this._createNotification(playerIds)
  }

  async _createNotification (playerIds: string[]) {
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
  fetchMachine (): Promise<MachineHandler> {
    return MachineHandler
      .find({_id: this.model.machine})
      .then(([machine]) => machine)
  }

  fetchLaundry (): Promise<LaundryHandler> {
    return LaundryHandler
      .find({_id: this.model.laundry})
      .then(([laundry]) => laundry)
  }

  static _fetchBookings (from: Date, to: Date, machineIds: ObjectId[]) {
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

  isOwner (user: UserHandler): Promise<boolean> {
    const owner = this.model.populated('owner') || this.model.owner
    return user.model._id.equals(owner)
  }

  async deleteBooking (): Promise<*> {
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
  async updateTime (owner: UserHandler, from: Date, to: Date) {
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

  buildRestSummary () {
    return {id: this.model.id, href: this.restUrl}
  }

  buildRestModel () {
    return this
      .fetchLaundry()
      .then(laundry => ({
        id: this.model.id,
        href: this.restUrl,
        from: laundry.dateToObject(this.model.from),
        to: laundry.dateToObject(this.model.to.toISOString())
      }))
  }

  buildReduxModel () {
    return {
      id: this.model.id,
      from: this.model.from,
      to: this.model.to,
      machine: this.model.machine.toString(),
      owner: this.model.owner.toString()
    }
  }

  emitEvent (event: EventType) {
    return Handler._emitEvent(event, BookingHandler, this)
  }

  update (): Promise<void> {
    throw new Error('Not implemented')
  }

  onDelete (cb: (id: string) => void) {
    return Handler._onDelete(BookingHandler, cb)
  }

  onUpdate (cb: (h: BookingHandler) => void) {
    return Handler._onUpdate(BookingHandler, cb)
  }

  onCreate (cb: (h: BookingHandler) => void) {
    return Handler._onCreate(BookingHandler, cb)
  }

  findLaundries () {
    return [this.model.laundry.id]
  }
}
