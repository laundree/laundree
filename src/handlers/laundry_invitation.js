// @flow

import LaundryHandler from './laundry'
import { Handler, HandlerLibrary } from './handler'
import LaundryInvitationModel from '../db/models/laundry_invitation'
import type {Invite} from 'laundree-sdk/lib/redux'
import type { ObjectId } from 'mongoose'
import type {LaundryInvitation as RestLaundryInvitation} from 'laundree-sdk/lib/sdk'

class LaundryInvitationHandlerLibrary extends HandlerLibrary<Invite, LaundryInvitationModel, RestLaundryInvitation, *> {

  constructor () {
    super(LaundryInvitationHandler, LaundryInvitationModel, {
      create: obj => typeof obj === 'string' ? null : {type: 'CREATE_INVITATION', payload: obj.reduxModel()},
      update: obj => typeof obj === 'string' ? null : {type: 'UPDATE_INVITATION', payload: obj.reduxModel()},
      delete: obj => typeof obj !== 'string' ? null : {type: 'DELETE_INVITATION', payload: obj}
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

export default class LaundryInvitationHandler extends Handler<LaundryInvitationModel, Invite, RestLaundryInvitation> {
  static restSummary (i: ObjectId | LaundryInvitationHandler) {
    const id = Handler.handlerOrObjectIdToString(i)
    return {id, href: '/api/invites/' + id}
  }

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

  async fetchLaundry () {
    return LaundryHandler.lib.findFromId(this.model.laundry)
  }

  toRest (): RestLaundryInvitation {
    return {
      email: this.model.email,
      id: this.model.id,
      laundry: LaundryHandler.restSummary(this.model.laundry),
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
