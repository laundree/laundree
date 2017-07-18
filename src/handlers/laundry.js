// @flow
import LaundryModel from '../db/models/laundry'
import type { LaundryRules } from '../db/models/laundry'
import { Handler, HandlerLibrary } from './handler'
import UserHandler from './user'
import type { MachineType } from '../db/models/machine'
import MachineHandler from './machine'
import BookingHandler from './booking'
import LaundryInvitationHandler from './laundry_invitation'
import * as error from '../utils/error'
import Debug from 'debug'
import uuid from 'uuid'
import config from 'config'
import moment from 'moment-timezone'
import { generateBase64UrlSafeCode, hashPassword, comparePassword } from '../utils/password'
import GoogleMapsClient from '@google/maps'
import type {EventOption as CalEvent} from 'ical-generator'

const googleMapsClient = GoogleMapsClient.createClient({key: config.get('google.serverApiKey')})
const debug = Debug('laundree.handlers.laundry')

function objToMintues ({hour, minute}) {
  return hour * 60 + minute
}

type DateTimeObject = { year: number, month: number, day: number, hour: number, minute: number }

class LaundryHandlerLibrary extends HandlerLibrary {

  constructor () {
    super(LaundryHandler, LaundryModel, {
      create: obj => typeof obj === 'string' ? null : {type: 'CREATE_LAUNDRY', payload: obj.reduxModel()},
      update: obj => typeof obj === 'string' ? null : {type: 'UPDATE_LAUNDRY', payload: obj.reduxModel()},
      delete: obj => typeof obj !== 'string' ? null : {type: 'DELETE_LAUNDRY', payload: obj}
    })
  }

  async createLaundry (owner: UserHandler, name: string, demo: boolean = false, timeZone: string = '', googlePlaceId: string = '') {
    const model = await new LaundryModel({
      name,
      owners: [owner.model._id],
      users: [owner.model._id],
      timezone: timeZone,
      googlePlaceId,
      demo
    }).save()
    const laundry = new LaundryHandler(model)
    this.emitEvent('create', laundry)
    await owner._addLaundry(laundry)
    return laundry
  }

  async createDemoLaundry (owner: UserHandler) {
    const name = `Demo Laundry ${uuid.v4()}`
    const laundry = await this.createLaundry(owner, name, true)
    const machines = [
      {name: 'Washer', type: 'wash'},
      {
        name: 'Dryer',
        type: 'dry'
      }]
    for (const machine of machines) {
      await laundry.createMachine(machine.name, machine.type)
    }
    return laundry
  }

  timeZoneFromGooglePlaceId (placeId: string) {
    return new Promise((resolve, reject) => {
      googleMapsClient.reverseGeocode({place_id: placeId}, (err, response) => {
        if (err) {
          return err.status === 400 ? resolve('') : reject(err)
        }
        if (response.status !== 200) return resolve('')
        const {json: {results: [result]}} = response
        if (!result) return resolve('')
        const {geometry: {location}} = result
        if (!location) return resolve('')
        googleMapsClient.timezone({location, timestamp: new Date()}, (err, response) => {
          if (err) return reject(err)
          if (response.status !== 200) return resolve('')
          resolve(response.json.timeZoneId)
        })
      })
    })
  }

}

export default class LaundryHandler extends Handler {
  static lib = new LaundryHandlerLibrary()
  lib = LaundryHandler.lib
  restUrl = `/api/laundries/${this.model.id}`

  /**
   * Delete the Laundry
   * @return {Promise.<LaundryHandler>}
   */
  async deleteLaundry () {
    const machines = await this.fetchMachines()
    await Promise.all(machines.map((machine) => machine._deleteMachine()))
    const invites = await this.fetchInvites()
    await Promise.all(invites.map((invite) => invite._deleteInvite()))
    const users = await this.fetchUsers()
    await Promise.all(users.map((user) => user._removeLaundry(this)))
    await this.model.remove()
    this.lib.emitEvent('delete', this)
    return this
  }

  /**
   * Eventually returns true iff the given user is a user of the laundry
   * @param {UserHandler} user
   * @return {boolean}
   */
  isUser (user: UserHandler) {
    return this.model.users.find((owner) => user.model._id.equals(owner))
  }

  /**
   * Eventually returns true iff the given user is a owner of the laundry
   * @param {UserHandler} user
   * @return {boolean}
   */
  isOwner (user: UserHandler) {
    return this.model.owners.find((owner) => user.model._id.equals(owner))
  }

  /**
   * Create a new machine with given name
   * @param {string} name
   * @param {string} type
   * @param {boolean} broken
   * @return {Promise.<MachineHandler>}
   */
  async createMachine (name: string, type: MachineType, broken: boolean) {
    const machine = await MachineHandler.lib._createMachine(this, name, type, broken)
    this.model.machines.push(machine.model._id)
    await this.save()
    return machine
  }

  /**
   * Create a new booking relative to the timezone of the laundry
   * @param {MachineHandler} machine
   * @param {UserHandler} owner
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} from
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} to
   */
  createBooking (machine: MachineHandler, owner: UserHandler, from: DateTimeObject, to: DateTimeObject) {
    const fromDate = this.dateFromObject(from)
    const toDate = this.dateFromObject(to)
    return machine.createBooking(owner, fromDate, toDate)
  }

  /**
   * Creates an date from a object (relative to the timezone of the laundry).
   * @param {{year: int, month: int, day: int, hour: int=, minute: int=}} object
   * @return {Date}
   */
  dateFromObject (object: DateTimeObject) {
    const mom = moment.tz(object, this.timezone())
    return mom.toDate()
  }

  /**
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} object
   * @returns {boolean}
   */
  validateDateObject (object: DateTimeObject) {
    const mom = moment.tz(object, this.timezone())
    return mom.isValid()
  }

  _objectToMoment (object: DateTimeObject) {
    return moment.tz(object, this.timezone())
  }

  /**
   * Creates an object from given date (relative to the timezone of the laundry).
   * @param {Date} d
   * @returns {{year: int, month: int, day: int, hour: int, minute: int}}
   */
  dateToObject (d: Date) {
    const mom = moment(d).tz(this.timezone())
    return {year: mom.year(), month: mom.month(), day: mom.date(), hour: mom.hours(), minute: mom.minutes()}
  }

  /**
   * Delete the given machine.
   * @param {MachineHandler} machine
   * @return {Promise}
   */
  async deleteMachine (machine: MachineHandler) {
    await machine._deleteMachine()
    this.model.machines.pull(machine.model._id)
    return this.save()
  }

  /**
   * Delete the given invite
   * @param {LaundryInvitationHandler} invite
   * @return {Promise}
   */
  async deleteInvite (invite: LaundryInvitationHandler) {
    await invite._deleteInvite()
    this.model.invites.pull(invite.model._id)
    return this.save()
  }

  /**
   * Fetch machines
   * @returns {Promise.<MachineHandler[]>}
   */
  fetchMachines (): Promise<MachineHandler[]> {
    return MachineHandler.lib.find({_id: this.model.machines})
  }

  /**
   * @returns {Promise.<LaundryInvitationHandler[]>}
   */
  fetchInvites (): Promise<LaundryInvitationHandler[]> {
    return LaundryInvitationHandler.lib.find({_id: this.model.invites})
  }

  /**
   * @returns {Promise.<UserHandler[]>}
   */
  fetchUsers (): Promise<UserHandler[]> {
    return UserHandler.lib.find({_id: this.model.users})
  }

  fetchOwners (): Promise<UserHandler[]> {
    return UserHandler.lib.find({_id: this.model.owners})
  }

  /**
   * Add a user
   * @param {UserHandler} user
   * @return {Promise.<int>} The number of new users added
   */
  async addUser (user: UserHandler) {
    if (this.isUser(user) || user.model.demo) return 0
    this.model.users.push(user.model._id)
    await this.save()
    await user._addLaundry(this)
    return 1
  }

  /**
   * Add a owner to this laundry
   * @param {UserHandler} user
   * @return {Promise.<int>} The number of owners added
   */
  async addOwner (user: UserHandler) {
    await this.addUser(user)
    if (this.isOwner(user)) {
      return 0
    }
    this.model.owners.push(user.model._id)
    await this.save()
    return 1
  }

  /**
   * Will remove the given user from owner-list
   * @param user
   * @return {Promise}
   */
  removeOwner (user: UserHandler) {
    this.model.owners.pull(user.model._id)
    return this.save()
  }

  /**
   * Will remove given user from laundry. Both as user or potential owner.
   * @param {UserHandler} user
   * @return {Promise.<LaundryHandler>}
   */
  async removeUser (user: UserHandler) {
    this.model.users.pull(user.model._id)
    this.model.owners.pull(user.model._id)
    await this.save()
    this._deleteBookings(user).catch(error.logError)
    await user._removeLaundry(this)
    return this
  }

  _deleteBookings (user: UserHandler) {
    return BookingHandler.lib.deleteBookings({
      owner: user.model._id,
      laundry: this.model._id
    })
  }

  updateLaundry ({name, timezone, rules, googlePlaceId}: { name?: string, timezone?: string, rules?: LaundryRules, googlePlaceId?: string }) {
    debug('Updating laundry')
    if (name) this.model.name = name
    if (timezone) this.model.timezone = timezone
    if (googlePlaceId) this.model.googlePlaceId = googlePlaceId
    if (rules) this.model.rules = rules
    return this.save()
  }

  /**
   * Fetch bookings for laundry.
   * Finds any booking with start before to and end after from
   * @param {{year: int, month: int, day: int}} from
   * @param {{year: int, month: int, day: int}} to
   * @return {BookingHandler[]}
   */
  fetchBookings (from: DateTimeObject, to: DateTimeObject) {
    return BookingHandler.lib._fetchBookings(
      this.dateFromObject(from),
      this.dateFromObject(to),
      this.model.machines)
  }

  /**
   * Invite a user by email address.
   * Returns an object containing either:
   *  * The user if a user exists and isn't invited
   *  * The invite if an invite hasn't already been sent
   *  * Neither
   * @param {string} email
   * @return {Promise.<{user: UserHandler=, invite: LaundryInvitationHandler=}>}
   */
  async inviteUserByEmail (email: string): {} | { user: UserHandler } | { invite: LaundryInvitationHandler } {
    const user = await UserHandler.lib.findFromEmail(email)
    if (user) {
      const num = await this.addUser(user)
      return num ? {user} : {}
    }
    const [i] = await LaundryInvitationHandler.lib.find({email, laundry: this.model._id})
    if (i) return {}
    const invite = await this.createInvitation(email)
    return {invite}
  }

  async createInvitation (email: string) {
    const invite = await LaundryInvitationHandler
      .lib
      ._createInvitation(this, email)
    this.model.invites.push(invite.model._id)
    await this.save()
    return invite
  }

  async toRest () {
    const [owners, users, machines, invites] = await Promise.all([
      this.fetchOwners(),
      this.fetchUsers(),
      this.fetchMachines(),
      this.fetchInvites()
    ])
    return {
      name: this.model.name,
      id: this.model.id,
      href: this.restUrl,
      owners: owners.map(o => o.toRestSummary()),
      users: users.map(u => u.toRestSummary()),
      machines: machines.map(m => m.toRestSummary()),
      invites: invites.map(i => i.toRestSummary())
    }
  }

  toRestSummary () {
    return {name: this.model.name, id: this.model.id, href: this.restUrl}
  }

  timezone () {
    return this.model.timezone || config.get('timezone')
  }

  googlePlaceId () {
    return this.model.googlePlaceId || config.get('googlePlaceId')
  }

  isDemo (): boolean {
    return this.model.demo
  }

  rules (): LaundryRules {
    const obj = this.model.rules.toObject()
    if (
      Object.keys(obj.timeLimit.from).length === 0 ||
      Object.keys(obj.timeLimit.to).length === 0
    ) {
      delete obj.timeLimit
    }
    return obj
  }

  /**
   * Check given times against time-limit
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} from
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} to
   * @returns {boolean}
   */
  checkTimeLimit (from: DateTimeObject, to: DateTimeObject) {
    const rules = this.rules()
    if (!rules.timeLimit) {
      return true
    }
    const {
      from: currentFrom,
      to: currentTo
    } = rules.timeLimit
    return objToMintues(from) >= objToMintues(currentFrom) && objToMintues(to) <= objToMintues(currentTo)
  }

  /**
   * Check given times against daily limit
   * @param {UserHandler} owner
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} from
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} to
   * @returns {boolean}
   */
  async checkDailyLimit (owner: UserHandler, from: DateTimeObject, to: DateTimeObject) {
    if (this.model.rules.dailyLimit === undefined) {
      return true
    }
    const {day, month, year} = from
    const bookings = await BookingHandler.lib.find({
      laundry: this.model._id,
      owner: owner.model._id,
      from: {$lt: this._objectToMoment({day, month, year, hour: 0, minute: 0}).add(1, 'day').toDate()},
      to: {$gt: this._objectToMoment({day, month, year, hour: 0, minute: 0}).toDate()}
    })
    const sum = this._countBookingTimes(bookings, objToMintues(to) - objToMintues(from))
    return sum <= this.model.rules.dailyLimit * 60
  }

  /**
   * Check given times against limit
   * @param {UserHandler} owner
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} from
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} to
   * @returns {boolean}
   */
  async checkLimit (owner: UserHandler, from: DateTimeObject, to: DateTimeObject) {
    if (this.model.rules.limit === undefined) {
      return true
    }
    const bookings = await BookingHandler
      .lib
      .find({
        laundry: this.model._id,
        owner: owner.model._id,
        from: {$gt: new Date()}
      })
    const sum = this._countBookingTimes(bookings, objToMintues(to) - objToMintues(from))
    return sum <= this.model.rules.limit * 60
  }

  _countBookingTimes (bookings: BookingHandler[], offset: number = 0) {
    return bookings
      .map(({model: {from, to}}) => ({
        from: this.dateToObject(from),
        to: this.dateToObject(to)
      }))
      .reduce((sum, {from, to}) => sum + objToMintues(to) - objToMintues(from), offset)
  }

  /**
   * Check if given times are the same day wrt. the timezone of the laundry
   * @param d1
   * @param d2
   * @returns {boolean}
   */
  isSameDay (d1: DateTimeObject, d2: DateTimeObject) {
    return moment.tz(d1, this.timezone()).format('YYYY-MM-DD') === moment.tz(d2, this.timezone()).format('YYYY-MM-DD')
  }

  /**
   * Create new sign-up code in base64 url-safe format
   * @returns {Promise.<string>}
   */
  createInviteCode () {
    return generateBase64UrlSafeCode(6)
      .then(code => hashPassword(code)
        .then(hash => {
          this.model.signUpCodes.push(hash)
          return this.save().then(() => code)
        }))
  }

  /**
   * @param {string} code
   * @returns {Promise.<bool>}
   */
  async verifyInviteCode (code: string) {
    const results = await Promise.all(this.model.signUpCodes.map(hash => comparePassword(code, hash)))
    return Boolean(results.find(v => v))
  }

  /**
   * Lists bookings as events
   * @returns {Promise.<{start: Date, end: Date, uid: string, timestamp: Date, url: string, summary: string}[]>}
   */
  generateEvents (): Promise<CalEvent[]> {
    return this
      .fetchMachines()
      .then(machines => Promise.all(machines.map(m => m.generateEvents())))
      .then(events => events.reduce((m1, m2) => m1.concat(m2), []))
      .then(events => events.map(({start, end, uid, timestamp, summary}) => ({
        start,
        end,
        uid,
        timestamp,
        summary,
        url: `${config.get('web.protocol')}://${config.get('web.host')}/laundries/${this.model.id}/timetable?offsetDate=${moment.tz(start, this.timezone()).format('YYYY-MM-DD')}`
      })))
  }

  reduxModel () {
    return {
      id: this.model.id,
      name: this.model.name,
      machines: this.model.machines.map(id => id.toString()),
      users: this.model.users.map(id => id.toString()),
      owners: this.model.owners.map(id => id.toString()),
      invites: this.model.invites.map(id => id.toString()),
      timezone: this.timezone(),
      googlePlaceId: this.googlePlaceId(),
      demo: this.model.demo,
      rules: this.rules()
    }
  }
}
