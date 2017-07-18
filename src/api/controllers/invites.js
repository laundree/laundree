// @flow

import * as api from '../helper'

function fetchInviteAsync (req, res) {
  const {invite} = req.subjects
  api.returnSuccess(res, invite.toRest())
}

async function deleteInviteAsync (req, res) {
  const {invite, laundry} = req.subjects
  await laundry.deleteInvite(invite)
  api.returnSuccess(res)
}

export const fetchInvite = api.wrapErrorHandler(fetchInviteAsync)
export const deleteInvite = api.wrapErrorHandler(deleteInviteAsync)
