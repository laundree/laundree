/**
 * Created by budde on 02/06/16.
 */

const Handler = require('./handler')
const {LaundryInvitationModel} = require('../models')

class LaundryInvitationHandler extends Handler {

  constructor (model, secret) {
    super(model)
    this.secret = secret
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
    return {email: this.model.email, id: this.model.id, href: this.href}
  }

  fetchLaundry () {
    const LaundryHandler = require('./laundry')
    return LaundryInvitationModel.populate(this.model, {path: 'laundry'})
      .then((model) => new LaundryHandler(model.laundry))
  }

  get href () {
    return `/api/invites/${this.model.id}`
  }

  toRest () {
    return this.fetchLaundry()
      .then(laundry => ({
        email: this.model.email,
        id: this.model.id,
        laundry: laundry.toRestSummary(),
        href: this.href
      }))
  }

  markUsed () {
    this.model.used = true
    return this.save()
  }
}

Handler.setupHandler(LaundryInvitationHandler, LaundryInvitationModel)

module.exports = LaundryInvitationHandler
