/**
 * Created by budde on 02/06/16.
 */

const Handler = require('./handler')
const {LaundryInvitationModel} = require('../models')
const EventEmitter = require('events')
const {linkEmitter} = require('../lib/redis')
const pubStaticEmitter = new EventEmitter()
const subStaticEmitter = new EventEmitter()

linkEmitter(
  subStaticEmitter,
  pubStaticEmitter,
  'laundryInvitation',
  ['create', 'delete', 'update'],
  (invitation) => Promise.resolve(invitation.model.id),
  (id) => LaundryInvitationHandler.findFromId(id))

class LaundryInvitationHandler extends Handler {

  constructor (model, secret) {
    super(model)
    this.secret = secret
  }

  static find (filter, options) {
    return this._find(LaundryInvitationModel, LaundryInvitationHandler, filter, options)
  }

  static findFromId (id) {
    return this._findFromId(LaundryInvitationModel, LaundryInvitationHandler, id)
  }

  static on () {
    return Handler._on(pubStaticEmitter, arguments)
  }

  static removeListener () {
    return Handler._removeListener(pubStaticEmitter, arguments)
  }

  emitEvent (event) {
    return this._emitEvent(subStaticEmitter, event)
  }

  /**
   * Create a new invitation
   * @param {LaundryHandler} laundry
   * @param {string} email
   */
  static _createInvitation (laundry, email) {
    return new LaundryInvitationModel({laundry: laundry.model._id, email: email.toLowerCase()}).save()
      .then((model) => new LaundryInvitationHandler(model))
      .then((invitation) => {
        invitation.emitEvent('create')
        return invitation
      })
  }

  _deleteInvite () {
    return this.model.remove().then(() => this)
  }

  toRestSummary () {
    return {email: this.model.email, id: this.model.id}
  }

  markUsed () {
    this.model.used = true
    return this.model.save().then(() => this.emitEvent('update')).then(() => this)
  }
}

module.exports = LaundryInvitationHandler
