// @flow

import { Handler, HandlerLibrary } from './handler'
import MachineModel from '../db/models/machine'
import type {MachineType} from '../db/models/machine'
import BookingHandler from './booking'
import LaundryHandler from './laundry'
import type UserHandler from './user'
import type {Machine} from 'laundree-sdk/lib/redux'
import type {Machine as RestMachine} from 'laundree-sdk/lib/sdk'
import type { ObjectId } from 'mongoose'
import config from 'config'

class MachineHandlerLibrary extends HandlerLibrary<Machine, MachineModel, RestMachine, *> {
  constructor () {
    super(MachineHandler, MachineModel, {
      create: obj => typeof obj === 'string' ? null : {type: 'CREATE_MACHINE', payload: obj.reduxModel()},
      update: obj => typeof obj === 'string' ? null : {type: 'UPDATE_MACHINE', payload: obj.reduxModel()},
      delete: obj => typeof obj !== 'string' ? null : {type: 'DELETE_MACHINE', payload: obj}
    })
  }

  async _createMachine (laundry: LaundryHandler, name: string, type: MachineType, broken: boolean) {
    const model = await new MachineModel({laundry: laundry.model._id, name, type, broken}).save()
    const machine = new MachineHandler(model)
    this.emitEvent('create', machine)
    return machine
  }
}

const restUrlPrefix = `${config.get('api.base')}/machines/`

export default class MachineHandler extends Handler<MachineModel, Machine, RestMachine> {
  static lib = new MachineHandlerLibrary()
  lib = MachineHandler.lib
  restUrl: string

  static restSummary (i: ObjectId | MachineHandler) {
    const id = Handler.handlerOrObjectIdToString(i)
    return {id, href: restUrlPrefix + id}
  }

  constructor (model: MachineModel) {
    super(model)
    this.restUrl = restUrlPrefix + this.model.id
  }

  /**
   * Create a new booking
   * @param {UserHandler} owner
   * @param {Date} from
   * @param {Date} to
   * @return {Promise.<BookingHandler>}
   */
  createBooking (owner: UserHandler, from: Date, to: Date) {
    return BookingHandler.lib._createBooking(this, owner, from, to)
  }

  findAdjacentBookingsOfUser (user: UserHandler, from: Date, to: Date) {
    return BookingHandler.lib.findAdjacentBookingsOfUser(user, this, from, to)
  }

  async _findAdjacentBookings (user: UserHandler, from: Date, to: Date) {
    const [{before, after}, laundry] = await (
      Promise.all([
        this.findAdjacentBookingsOfUser(user, from, to), // Find bookings that should be merged
        this.fetchLaundry()
      ])
    )
    const fromObject = laundry.dateToObject(from)
    const toObject = laundry.dateToObject(to)
    const result = {before, after, from, to}
    if (!before || fromObject.hour + fromObject.minute <= 0) {
      result.before = undefined
    } else {
      result.from = before.model.from
    }
    if (!after || toObject.hour >= 24) {
      result.after = undefined
    } else {
      result.to = after.model.to
    }
    return result
  }

  async createAndMergeBooking (owner: UserHandler, from: Date, to: Date) {
    const {before, after, from: fromDate, to: toDate} = await this._findAdjacentBookings(owner, from, to)
    if (before && after) { // If no adjacent bookings
      await after.deleteBooking()
      await before.updateTime(owner, fromDate, toDate)
      return before
    }
    if (after) { // If no before
      await after.updateTime(owner, fromDate, toDate).then(() => after)
      return after
    }
    if (before) {
      await before.updateTime(owner, fromDate, toDate)
      return before
    }
    return this.createBooking(owner, fromDate, toDate)
  }

  fetchLaundry () {
    return LaundryHandler.lib.find({_id: this.model.laundry}).then(([laundry]) => laundry)
  }

  async update ({name, type, broken}: { name?: string, type?: MachineType, broken?: boolean }) {
    if (name) this.model.name = name
    if (type) this.model.type = type
    if (broken !== undefined) this.model.broken = broken
    await this.model.save()
    this.lib.emitEvent('update', this)
    return this
  }

  /**
   * Fetch bookings for machine.
   * Finds any booking with start before to and end after from
   * @param {Date} from
   * @param {Date} to
   * @return {BookingHandler[]}
   */
  fetchBookings (from: Date, to: Date) {
    return BookingHandler.lib._fetchBookings(from, to, [this.model._id])
  }

  async _deleteMachine () {
    const bookings = await BookingHandler
      .lib
      .find({machine: this.model._id})
    await Promise.all(bookings.map((booking) => booking.deleteBooking()))
    await this.model.remove()
    this.lib.emitEvent('delete', this)
    return this
  }

  /**
   * Lists bookings as events
   * @returns {Promise.<{start: Date, end: Date, uid: string, timestamp: Date, summary: string}[]>}
   */
  async generateEvents () {
    const bookings = await BookingHandler.lib.find({machine: this.model._id})
    const bookingEvents = bookings.map((booking: BookingHandler) => booking.event())
    return bookingEvents.map(({start, end, uid, timestamp}) => ({
      start,
      end,
      uid,
      timestamp,
      summary: this.model.name
    }))
  }

  toRest (): RestMachine {
    return {
      name: this.model.name,
      href: this.restUrl,
      id: this.model.id,
      type: this.model.type,
      broken: this.model.broken
    }
  }

  reduxModel () {
    return {
      id: this.model.id,
      type: this.model.type,
      name: this.model.name,
      broken: this.model.broken
    }
  }
}
