/**
 * Created by budde on 09/06/16.
 */

const {api} = require('../../utils')

function fetchInvite (req, res) {
  const {invite} = req.subjects
  api.returnSuccess(res, invite.toRest())
}

function deleteInvite (req, res) {
  const {invite, laundry} = req.subjects
  laundry.deleteInvite(invite).then(() => api.returnSuccess(res))
    .catch(api.generateErrorHandler(res))
}

module.exports = {fetchInvite, deleteInvite}
