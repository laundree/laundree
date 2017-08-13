// @flow

import * as api from '../helper'

async function fetchInviteAsync (subjects) {
  const {invite} = api.assertSubjects({invite: subjects.invite})
  return invite.toRest()
}

async function deleteInviteAsync (subjects) {
  const {invite, laundry} = api.assertSubjects({invite: subjects.invite, laundry: subjects.laundry})
  await laundry.deleteInvite(invite)
}

export const fetchInvite = api.wrap(fetchInviteAsync, api.securityLaundryOwner)
export const deleteInvite = api.wrap(deleteInviteAsync, api.securityLaundryOwner)
