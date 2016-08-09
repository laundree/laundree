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

  static find (filter, options) {
    return this._find(LaundryInvitationModel, LaundryInvitationHandler, filter, options)
  }

  static findFromId (id) {
    return this._findFromId(LaundryInvitationModel, LaundryInvitationHandler, id)
  }

  /**
   * Create a new invitation
   * @param {LaundryHandler} laundry
   * @param {string} email
   */
  static createInvitation (laundry, email) {
    return new LaundryInvitationModel({laundry: laundry.model._id, email}).save()
      .then((model) => new LaundryInvitationHandler(model))
  }
}

module.exports = LaundryInvitationHandler
