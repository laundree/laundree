/**
 * Created by budde on 09/06/16.
 */

const {LaundryInvitationHandler} = require('../../handlers')
const {api} = require('../../utils')

function fetchInvite (req, res) {
  const id = req.swagger.params.id.value
  LaundryInvitationHandler
    .findFromId(id)
    .then((invite) => {
      if (!invite) return api.returnError(res, 404, 'Invite not found')
      return invite.fetchLaundry()
        .then((laundry) => {
          if (!laundry.isOwner(req.user)) return api.returnError(res, 404, 'Invite not found')
          return api.returnSuccess(res, invite.toRest())
        })
    })
    .catch(api.generateErrorHandler(res))
}

function deleteInvite (req, res) {
  const id = req.swagger.params.id.value
  LaundryInvitationHandler
    .findFromId(id)
    .then((invite) => {
      if (!invite) return api.returnError(res, 404, 'Invite not found')
      return invite.fetchLaundry()
        .then((laundry) => {
          if (!laundry.isOwner(req.user)) return api.returnError(res, 404, 'Invite not found')
          return laundry.deleteInvite(invite).then(() => api.returnSuccess(res))
        })
    })
    .catch(api.generateErrorHandler(res))
}

module.exports = {fetchInvite, deleteInvite}
