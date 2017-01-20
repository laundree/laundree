/**
 * Created by budde on 02/06/16.
 */
const {LaundryModel} = require('../models')
const Handler = require('./handler')
const UserHandler = require('./user')
const MachineHandler = require('./machine')
const BookingHandler = require('./booking')
const LaundryInvitationHandler = require('./laundry_invitation')

const debug = require('debug')('laundree.handlers.laundry')
const uuid = require('uuid')
const config = require('config')
const {types: {DELETE_LAUNDRY, UPDATE_LAUNDRY, CREATE_LAUNDRY}} = require('../redux/actions')
const moment = require('moment-timezone')
const {generateBase64UrlSafeCode, hashPassword, comparePassword} = require('../utils/password')
const googleMapsClient = require('@google/maps').createClient({key: config.get('google.serverApiKey')})

function objToMintues ({hour, minute}) {
  return hour * 60 + minute
}

class LaundryHandler extends Handler {
  /**
   * Create a new laundry.
   * @param {UserHandler} owner
   * @param {string} name
   * @param {boolean} demo
   * @param {string} timeZone
   * @param {string} googlePlaceId
   * @return {Promise.<LaundryHandler>}
   */
  static createLaundry (owner, name, demo = false, timeZone = '', googlePlaceId = '') {
    return new LaundryModel({
      name,
      owners: [owner.model._id],
      users: [owner.model._id],
      timezone: timeZone,
      googlePlaceId,
      demo
    })
      .save()
      .then((model) => new LaundryHandler(model))
      .then((laundry) => {
        laundry.emitEvent('create')
        return owner._addLaundry(laundry).then(() => laundry)
      })
  }

  static createDemoLaundry (owner) {
    const name = `Demo Laundry ${uuid.v4()}`
    return LaundryHandler
      .createLaundry(owner, name, true)
      .then(laundry => [{name: 'Washer', type: 'wash'}, {name: 'Dryer', type: 'dry'}]
        .reduce((prom, {name, type}) => prom.then(() => laundry.createMachine(name, type)), Promise.resolve()))
  }

  static timeZoneFromGooglePlaceId (placeId) {
    return new Promise((resolve, reject) => {
      googleMapsClient.reverseGeocode({place_id: placeId}, (err, response) => {
        if (err) return reject(err)
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

  /**
   * Delete the Laundry
   * @return {Promise.<LaundryHandler>}
   */
  deleteLaundry () {
    return this.fetchMachines()
      .then((machines) => Promise.all(machines.map((machine) => machine._deleteMachine())))
      .then(() => this.fetchInvites())
      .then((invites) => Promise.all(invites.map((invite) => invite._deleteInvite())))
      .then(() => this.fetchUsers())
      .then((users) => Promise.all(users.map((user) => user._removeLaundry(this))))
      .then(() => this.model.remove())
      .then(() => {
        this.emitEvent('delete')
        return this
      })
  }

  /**
   * Eventually returns true iff the given user is a user of the laundry
   * @param {UserHandler} user
   * @return {boolean}
   */
  isUser (user) {
    const users = this.model.populated('users') || this.model.users
    return users.find((owner) => user.model._id.equals(owner))
  }

  /**
   * Eventually returns true iff the given user is a owner of the laundry
   * @param {UserHandler} user
   * @return {boolean}
   */
  isOwner (user) {
    const users = this.model.populated('owners') || this.model.owners
    return users.find((owner) => user.model._id.equals(owner))
  }

  /**
   * Is this laundry a demo laundry
   * @returns {boolean}
   */
  get isDemo () {
    return Boolean(this.model.demo)
  }

  /**
   * Create a new machine with given name
   * @param {string} name
   * @param {string} type
   * @return {Promise.<MachineHandler>}
   */
  createMachine (name, type) {
    return MachineHandler._createMachine(this, name, type).then((machine) => {
      this.model.machines.push(machine.model._id)
      return this.save().then(() => machine)
    })
  }

  /**
   * Create a new booking relative to the timezone of the laundry
   * @param {MachineHandler} machine
   * @param {UserHandler} owner
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} from
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} to
   */
  createBooking (machine, owner, from, to) {
    const fromDate = this.dateFromObject(from)
    const toDate = this.dateFromObject(to)
    return machine.createBooking(owner, fromDate, toDate)
  }

  /**
   * Creates an date from a object (relative to the timezone of the laundry).
   * @param {{year: int, month: int, day: int, hour: int=, minute: int=}} object
   * @return {Date}
   */
  dateFromObject (object) {
    const mom = moment.tz(object, this.timezone)
    return mom.toDate()
  }

  /**
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} object
   * @returns {boolean}
   */
  validateDateObject (object) {
    const mom = moment.tz(object, this.timezone)
    return mom.isValid()
  }

  _objectToMoment (object) {
    return moment.tz(object, this.timezone)
  }

  /**
   * Creates an object from given date (relative to the timezone of the laundry).
   * @param {Date} d
   * @returns {{year: int, month: int, day: int, hour: int, minute: int}}
   */
  dateToObject (d) {
    const mom = moment(d).tz(this.timezone)
    return {year: mom.year(), month: mom.month(), day: mom.date(), hour: mom.hours(), minute: mom.minutes()}
  }

  /**
   * Delete the given machine.
   * @param {MachineHandler} machine
   * @return {Promise}
   */
  deleteMachine (machine) {
    return machine._deleteMachine()
      .then(() => {
        this.model.machines.pull(machine.model._id)
        return this.save()
      })
  }

  /**
   * Delete the given invite
   * @param {LaundryInvitationHandler} invite
   * @return {Promise}
   */
  deleteInvite (invite) {
    return invite._deleteInvite()
      .then(() => {
        this.model.invites.pull(invite.model._id)
        return this.save()
      })
  }

  /**
   * Fetch machines
   * @returns {Promise.<MachineHandler[]>}
   */
  fetchMachines () {
    return this._fetchField(MachineHandler, 'machines')
  }

  /**
   * @returns {Promise.<LaundryInvitationHandler[]>}
   */
  fetchInvites () {
    return this._fetchField(LaundryInvitationHandler, 'invites')
  }

  /**
   * @returns {Promise.<UserHandler[]>}
   */
  fetchUsers () {
    return this._fetchField(UserHandler, 'users')
  }

  _fetchField (_Handler, path) {
    return LaundryModel.populate(this.model, {path})
      .then((m) => m[path].map((i) => new _Handler(i)))
  }

  /**
   * @return {string[]}
   */
  get machineIds () {
    return this.fetchIds('machines')
  }

  /**
   * @return {string[]}
   */
  get userIds () {
    return this.fetchIds('users')
  }

  /**
   * @return {string[]}
   */
  get ownerIds () {
    return this.fetchIds('owners')
  }

  /**
   * @return {string[]}
   */
  get inviteIds () {
    return this.fetchIds('invites')
  }

  fetchIds (field) {
    return (this.model.populated(field) || this.model[field]).map((id) => id.toString())
  }

  /**
   * Add a user
   * @param {UserHandler} user
   * @return {Promise.<int>} The number of new users added
   */
  addUser (user) {
    if (this.isUser(user)) return Promise.resolve(0)
    this.model.users.push(user.model._id)
    return this
      .save()
      .then(() => user._addLaundry(this))
      .then(() => 1)
  }

  /**
   * Add a owner to this laundry
   * @param {UserHandler} user
   * @return {Promise.<int>} The number of owners added
   */
  addOwner (user) {
    return this
      .addUser(user)
      .then(() => {
        if (this.isOwner(user)) return 0
        this.model.owners.push(user.model._id)
        return this.save().then(() => 1)
      })
  }

  /**
   * Will remove the given user from owner-list
   * @param user
   * @return {Promise}
   */
  removeOwner (user) {
    this.model.owners.pull(user.model._id)
    return this.save()
  }

  /**
   * Will remove given user from laundry. Both as user or potential owner.
   * @param {UserHandler} user
   * @return {Promise.<LaundryHandler>}
   */
  removeUser (user) {
    this.model.users.pull(user.model._id)
    this.model.owners.pull(user.model._id)
    return this
      .save()
      .then(() => this._deleteBookings(user))
      .then(() => user._removeLaundry(this))
      .then(() => this)
  }

  _deleteBookings (user) {
    return BookingHandler.deleteBookings({
      owner: user.model._id,
      laundry: this.model._id
    })
  }

  updateLaundry ({name, timezone, rules, googlePlaceId}) {
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
  fetchBookings (from, to) {
    return BookingHandler._fetchBookings(
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
  inviteUserByEmail (email) {
    return UserHandler
      .findFromEmail(email)
      .then((user) => {
        if (user) return this.addUser(user).then((num) => num ? {user} : {})
        return LaundryInvitationHandler
          .find({email, laundry: this.model._id})
          .then(([invite]) => {
            if (invite) return {}
            return this.createInvitation(email).then(invite => ({invite}))
          })
      })
  }

  createInvitation (email) {
    return LaundryInvitationHandler
      ._createInvitation(this, email)
      .then((invite) => {
        this.model.invites.push(invite.model._id)
        return this
          .save()
          .then(() => invite)
      })
  }

  toRest () {
    const UserHandler = require('./user')
    return LaundryModel.populate(this.model, {path: 'owners users machines invites'}).then((model) => ({
      name: model.name,
      id: model.id,
      href: this.restUrl,
      owners: model.owners.map((m) => new UserHandler(m).toRestSummary()),
      users: model.users.map((m) => new UserHandler(m).toRestSummary()),
      machines: model.machines.map((m) => new MachineHandler(m).toRestSummary()),
      invites: model.invites.map((m) => new LaundryInvitationHandler(m).toRestSummary())
    }))
  }

  get restUrl () {
    return `/api/laundries/${this.model.id}`
  }

  toRestSummary () {
    return {name: this.model.name, id: this.model.id, href: this.restUrl}
  }

  get timezone () {
    return this.model.timezone || config.get('timezone')
  }

  get googlePlaceId () {
    return this.model.googlePlaceId || config.get('googlePlaceId')
  }

  get rules () {
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
  checkTimeLimit (from, to) {
    const {
      from: currentFrom,
      to: currentTo
    } = this.model.rules.timeLimit
    if (currentFrom.hour === undefined || currentFrom.minute === undefined || currentTo.hour === undefined || currentTo.minute === undefined) return true
    return objToMintues(from) >= objToMintues(currentFrom) && objToMintues(to) <= objToMintues(currentTo)
  }

  /**
   * Check given times against daily limit
   * @param {UserHandler} owner
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} from
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} to
   * @returns {boolean}
   */
  checkDailyLimit (owner, from, to) {
    if (this.model.rules.dailyLimit === undefined) return Promise.resolve(true)
    const {day, month, year} = from
    return BookingHandler
      .find({
        laundry: this.model._id,
        owner: owner.model._id,
        from: {$lt: this._objectToMoment({day, month, year}).add(1, 'day').toDate()},
        to: {$gt: this.dateFromObject({day, month, year})}
      })
      .then(bookings => this._countBookingTimes(bookings, objToMintues(to) - objToMintues(from)))
      .then(sum => sum <= this.model.rules.dailyLimit * 60)
  }

  /**
   * Check given times against limit
   * @param {UserHandler} owner
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} from
   * @param {{year: int, month: int, day: int, hour: int, minute: int}} to
   * @returns {boolean}
   */
  checkLimit (owner, from, to) {
    if (this.model.rules.limit === undefined) return Promise.resolve(true)
    return BookingHandler
      .find({
        laundry: this.model._id,
        owner: owner.model._id,
        from: {$gt: new Date()}
      })
      .then(bookings => this._countBookingTimes(bookings, objToMintues(to) - objToMintues(from)))
      .then(sum => sum <= this.model.rules.limit * 60)
  }

  _countBookingTimes (bookings, offset = 0) {
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
  isSameDay (d1, d2) {
    return moment.tz(d1, this.timezone).format('YYYY-MM-DD') === moment.tz(d2, this.timezone).format('YYYY-MM-DD')
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
  verifyInviteCode (code) {
    return Promise.all(this.model.signUpCodes.map(hash => comparePassword(code, hash))).then(results => Boolean(results.find(v => v)))
  }

  /**
   * Lists bookings as events
   * @returns {Promise.<{start: Date, end: Date, uid: string, timestamp: Date, url: string, summary: string}[]>}
   */
  generateEvents () {
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
        url: `${config.get('web.protocol')}://${config.get('web.host')}/laundries/${this.model.id}/timetable?offsetDate=${moment.tz(start, this.timezone).format('YYYY-MM-DD')}`
      })))
  }

  get reduxModel () {
    return {
      id: this.model.id,
      name: this.model.name,
      machines: this.machineIds,
      users: this.userIds,
      owners: this.ownerIds,
      invites: this.inviteIds,
      timezone: this.timezone,
      googlePlaceId: this.googlePlaceId,
      demo: this.model.demo,
      rules: this.rules
    }
  }

  get eventData () {
    return {demo: this.isDemo}
  }
}

Handler.setupHandler(LaundryHandler, LaundryModel, {
  create: CREATE_LAUNDRY,
  delete: DELETE_LAUNDRY,
  update: UPDATE_LAUNDRY
})

module.exports = LaundryHandler
