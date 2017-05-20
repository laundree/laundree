// @flow

import LaundryHandler from './laundry'
import { Handler, HandlerLibrary } from './handler'
import LaundryInvitationModel from '../models/laundry_invitation'
import { redux } from 'laundree-sdk'
import type { Invite } from 'laundree-sdk/src/redux'

class LaundryInvitationHandlerLibrary extends HandlerLibrary<Invite, LaundryInvitationModel, *> {

  constructor () {
    super(LaundryInvitationHandler, LaundryInvitationModel, {
      create: obj => typeof obj === 'string' ? null : {type: redux.types.CREATE_INVITATION, payload: obj.reduxModel()},
      update: obj => typeof obj === 'string' ? null : {type: redux.types.UPDATE_INVITATION, payload: obj.reduxModel()},
      delete: obj => typeof obj !== 'string' ? null : {type: redux.types.DELETE_INVITATION, payload: obj}
    })
  }

  /**
   * Create a new invitation
   * @param {LaundryHandler} laundry
   * @param {string} email
   */
  async _createInvitation (laundry: LaundryHandler, email: string) {
    const model = await new LaundryInvitationModel({laundry: laundry.model._id, email: email.toLowerCase()}).save()
    const handler = new LaundryInvitationHandler(model)
    this.emitEvent('create', handler)
    return handler
  }

}

export default class LaundryInvitationHandler extends Handler<LaundryInvitationModel, Invite> {

  static lib = new LaundryInvitationHandlerLibrary()
  lib = LaundryInvitationHandler.lib
  href: string

  constructor (model: LaundryInvitationModel) {
    super(model)
    this.href = `/api/invites/${this.model.id}`
  }

  _deleteInvite () {
    return this.model.remove().then(() => this)
  }

  toRestSummary () {
    return {email: this.model.email, id: this.model.id, href: this.href}
  }

  async fetchLaundry () {
    return LaundryHandler.lib.findFromId(this.model.laundry)
  }

  async toRest () {
    const laundry = await this.fetchLaundry()
    return {
      email: this.model.email,
      id: this.model.id,
      laundry: laundry.toRestSummary(),
      href: this.href
    }
  }

  markUsed () {
    this.model.used = true
    return this.save()
  }

  reduxModel () {
    return {
      used: this.model.used,
      id: this.model.id,
      email: this.model.email,
      laundry: this.model.laundry.toString()
    }
  }
}
