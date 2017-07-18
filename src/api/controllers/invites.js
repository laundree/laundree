// @flow

import * as api from '../helper'
import type LaundryInviteHandler from '../../handlers/laundry_invitation'
import type LaundryHandler from '../../handlers/laundry'

async function fetchInviteAsync (subjects: {invite: LaundryInviteHandler}) {
  return subjects.invite.toRest()
}

async function deleteInviteAsync (subjects: {invite: LaundryInviteHandler, laundry: LaundryHandler}) {
  const {invite, laundry} = subjects
  await laundry.deleteInvite(invite)
}

export const fetchInvite = api.wrap(fetchInviteAsync, api.securityLaundryOwner)
export const deleteInvite = api.wrap(deleteInviteAsync, api.securityLaundryOwner)
