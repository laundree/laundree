/**
 * Created by budde on 02/06/16.
 */
const {LaundryModel} = require('../models')
const Handler = require('./handler')
const MachineHandler = require('./machine')
const BookingHandler = require('./booking')
const EventEmitter = require('events')
const {linkEmitter} = require('../lib/redis')

const pubStaticEmitter = new EventEmitter()
const subStaticEmitter = new EventEmitter()

linkEmitter(
  subStaticEmitter,
  pubStaticEmitter,
  'laundry',
  ['update', 'create'],
  (laundry) => Promise.resolve(laundry.model.id),
  (id) => LaundryHandler.findFromId(id))

class LaundryHandler extends Handler {

  static find (filter, options) {
    return Handler._find(LaundryModel, LaundryHandler, filter, options)
  }

  static on () {
    return Handler._on(pubStaticEmitter, arguments)
  }

  static removeListener () {
    return Handler._removeListener(pubStaticEmitter, arguments)
  }

  /**
   * Find an handler from given id.
   * @param id
   * @returns {Promise.<TokenHandler>}
   */
  static findFromId (id) {
    return Handler._findFromId(LaundryModel, LaundryHandler, id)
  }

  /**
   * Create a new laundry.
   * @param {UserHandler} owner
   * @param {string} name
   * @return {Promise.<LaundryHandler>}
   */
  static _createLaundry (owner, name) {
    return new LaundryModel({
      name: name,
      owners: [owner.model._id],
      users: [owner.model._id]
    })
      .save()
      .then((model) => new LaundryHandler(model))
      .then((laundry) => {
        laundry.emitEvent('create')
        return laundry
      })
  }

  emitEvent (event) {
    return this._emitEvent(subStaticEmitter, event)
  }

  /**
   * Delete the Laundry
   * @return {Promise.<LaundryHandler>}
   */
  _deleteLaundry () {
    return this.model.remove().then(() => this)
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
   * Create a new machine with given name
   * @param {string} name
   * @param {string} type
   * @return {Promise.<MachineHandler>}
   */
  createMachine (name, type) {
    return MachineHandler._createMachine(this, name, type).then((machine) => {
      this.model.machines.push(machine.model._id)
      return this.model.save().then(() => machine).then((machine) => {
        this.emitEvent('update')
        return machine
      })
    })
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
        return this.model.save()
      })
      .then(() => {
        this.emitEvent('update')
        return this
      })
  }

  fetchMachines () {
    return LaundryModel.populate(this.model, {path: 'machines'})
      .then(({machines}) => machines.map((l) => new MachineHandler(l)))
  }

  /**
   * @return {string[]}
   */
  get machineIds () {
    return (this.model.populated('machines') || this.model.machines).map((id) => id.toString())
  }

  /**
   * Add a user
   * @param {UserHandler} user
   * @return {Promise.<LaundryHandler>}
   */
  _addUser (user) {
    if (this.isUser(user)) return Promise.resolve(this)
    this.model.users.push(user.model._id)
    return this.model.save().then((model) => {
      this.model = model
      return this
    })
  }

  /**
   * Will remove given user from laundry. Both as user or potential owner.
   * @param {UserHandler} user
   * @return {Promise.<LaundryHandler>}
   */
  _removeUser (user) {
    this.model.users.pull(user.model._id)
    this.model.owners.pull(user.model._id)
    return this.model.save().then((m) => {
      this.model = m
      return this
    })
  }

  /**
   * Fetch bookings for laundry.
   * Finds any booking with start before to and end after from
   * @param {Date} from
   * @param {Date} to
   * @return {BookingHandler[]}
   */
  fetchBookings (from, to) {
    console.log(from, to)
    return BookingHandler.find({
      $or: [
        {
          machine: {$in: this.model.machines},
          from: {$lte: from},
          to: {$gt: from}
        },
        {
          machine: {$in: this.model.machines},
          from: {$lt: to},
          to: {$gte: to}
        },
        {
          machine: {$in: this.model.machines},
          from: {$gte: from},
          to: {$lte: to}
        }
      ]
    })
  }

  toRest () {
    const UserHandler = require('./user')
    return LaundryModel.populate(this.model, {path: 'owners users'}).then((model) => ({
      name: model.name,
      id: model.id,
      href: this.restUrl,
      owners: model.owners.map((m) => new UserHandler(m).toRestSummary()),
      users: model.users.map((m) => new UserHandler(m).toRestSummary())
    }))
  }

  get restUrl () {
    return `/api/laundries/${this.model.id}`
  }

  toRestSummary () {
    return {name: this.model.name, id: this.model.id, href: this.restUrl}
  }
}

module.exports = LaundryHandler
