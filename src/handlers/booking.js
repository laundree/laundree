// @flow

import { Handler, HandlerLibrary } from './handler'
import BookingModel from '../models/booking'
import { createNotification, deleteNotification } from '../utils/oneSignal'
import { logError } from '../utils/error'
import type UserHandler from './user'
import type { QueryOptions, QueryConditions, ObjectId } from 'mongoose'
import MachineHandler from './machine'
import LaundryHandler from './laundry'
import type {Booking} from 'laundree-sdk/lib/redux'

class BookingHandlerLibrary extends HandlerLibrary<Booking, BookingModel, *> {

  constructor () {
    super(BookingHandler, BookingModel, {
      create: obj => typeof obj === 'string' ? null : ({type: 'CREATE_BOOKING', payload: obj.reduxModel()}),
      update: obj => typeof obj === 'string' ? null : ({type: 'UPDATE_BOOKING', payload: obj.reduxModel()}),
      delete: obj => typeof obj !== 'string' ? null : ({type: 'DELETE_BOOKING', payload: obj})
    })
  }

  async _createBooking (machine: MachineHandler, owner: UserHandler, from: Date, to: Date) {
    const model = await new BookingModel({
      docVersion: 1,
      laundry: machine.model.laundry,
      machine: machine.model._id,
      owner: owner.model._id,
      from,
      to
    }).save()
    const booking = new BookingHandler(model)
    this.emitEvent('create', booking)
    booking._createNotification(owner.model.oneSignalPlayerIds).catch(logError)
    return booking
  }

  /**
   * Delete multiple bookings without emitting events
   * @param query
   * @returns {Promise}
   */
  async deleteBookings (query: QueryConditions = {}) {
    const bookings = await this.find(query)
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
  async findAdjacentBookingsOfUser (user: UserHandler, machine: MachineHandler, from: Date, to: Date): Promise<{ before: ?BookingHandler, after: ?BookingHandler }> {
    const [[before], [after]] = await Promise.all([
      this.findBookingForUserAndMachine(user, machine, {to: from}, {limit: 1}),
      this.findBookingForUserAndMachine(user, machine, {from: to}, {limit: 1})
    ])
    return {before, after}
  }

  /**
   * Find booking for user and machine
   * @param {UserHandler} user
   * @param {MachineHandler} machine
   * @param filter
   * @param options
   * @returns {Promise.<BookingHandler[]>}
   */
  findBookingForUserAndMachine (user: UserHandler, machine: MachineHandler, filter: QueryConditions = {}, options: QueryOptions = {}) {
    return this.find({...filter, owner: user.model._id, machine: machine.model._id}, options)
  }

  _fetchBookings (from: Date, to: Date, machineIds: ObjectId[]) {
    return BookingHandler.lib.find({
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
}

export default class BookingHandler extends Handler<BookingModel, Booking> {
  static lib = new BookingHandlerLibrary()
  lib = BookingHandler.lib
  restUrl: string

  updateActions = [
    (booking: BookingHandler) => {
      return MachineHandler
        .lib
        .find({_id: booking.model.machine})
        .then(([machine]) => {
          booking.model.laundry = machine.model.laundry
          booking.model.docVersion = 1
          return booking.model.save().then((model) => new BookingHandler(model))
        })
    }
  ]

  constructor (model: BookingModel) {
    super(model)
    this.restUrl = `/api/bookings/${this.model.id}`
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
  fetchMachine () {
    return MachineHandler
      .lib
      .find({_id: this.model.machine})
      .then(([machine]) => machine)
  }

  fetchLaundry () {
    return LaundryHandler
      .lib
      .find({_id: this.model.laundry})
      .then(([laundry]) => laundry)
  }

  /**
   * Checks if provided user is owner
   * @param {UserHandler} user
   * @return {boolean}
   */
  isOwner (user: UserHandler) {
    const owner = this.model.populated('owner') || this.model.owner
    return user.model._id.equals(owner)
  }

  async deleteBooking () {
    this._cancelNotification().catch(logError)
    await this.model.remove()
    this.lib.emitEvent('delete', this)
    return this
  }

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
    this.lib.emitEvent('update', this)
    return this
  }

  toRestSummary () {
    return {id: this.model.id, href: this.restUrl}
  }

  async toRest () {
    const laundry = await this.fetchLaundry()
    return {
      id: this.model.id,
      href: this.restUrl,
      from: laundry.dateToObject(this.model.from),
      to: laundry.dateToObject(this.model.to.toISOString())
    }
  }

  event () {
    return {
      start: this.model.from,
      end: this.model.to,
      uid: this.model.id,
      timestamp: this.model.createdAt
    }
  }

  reduxModel () {
    return {
      id: this.model.id,
      from: this.model.from,
      to: this.model.to,
      machine: this.model.machine.toString(),
      owner: this.model.owner.toString()
    }
  }
}
