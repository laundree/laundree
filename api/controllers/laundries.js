const {LaundryHandler} = require('../../handlers')
const {api} = require('../../utils')
/**
 * Created by budde on 02/06/16.
 */

function listLaundries (req, res) {
  const filter = {users: req.user.model._id}
  const limit = req.swagger.params.page_size.value
  const since = req.swagger.params.since.value
  if (since) {
    filter._id = {$gt: since}
  }
  LaundryHandler.find(filter, limit)
    .then((laundries) => laundries.map((laundry) => laundry.toRestSummary()))
    .then((laundries) => {
      var links = {
        first: `/api/laundries?page_size=${limit}`
      }
      if (laundries.length === limit) {
        links.next = `/api/laundries?since=${laundries[laundries.length - 1].id}&page_size=${limit}`
      }
      res.links(links)
      res.json(laundries)
    })
    .catch(api.generateErrorHandler(res))
}

function createLaundry (req, res) {
  const name = req.swagger.params.body.value.name.trim()
  if (name === '') return api.returnError(res, 400, 'Invalid name')
  LaundryHandler
    .find({name: name})
    .then(([laundry]) => {
      if (laundry) return api.returnError(res, 400, 'Laundry already exists')
      return req.user.createLaundry(name)
        .then((laundry) => api.returnSuccess(res, laundry.toRest()))
    })
    .catch(api.generateErrorHandler(res))
}

function fetchLaundry (req, res) {
  const id = req.swagger.params.id.value
  LaundryHandler
    .findFromId(id)
    .then((laundry) => {
      if (!laundry) return api.returnError(res, 404, 'Laundry not found')
      if (!laundry.isUser(req.user)) return api.returnError(res, 404, 'Laundry not found')
      return api.returnSuccess(res, laundry.toRest())
    })
    .catch(api.generateErrorHandler(res))
}

function deleteLaundry (req, res) {
  const id = req.swagger.params.id.value
  LaundryHandler
    .findFromId(id)
    .then((laundry) => {
      if (!laundry) return api.returnError(res, 404, 'Laundry not found')
      if (!laundry.isUser(req.user)) return api.returnError(res, 404, 'Laundry not found')
      if (!laundry.isOwner(req.user)) return api.returnError(res, 403, 'Not allowed')
      return req.user.deleteLaundry(laundry).then(() => api.returnSuccess(res))
    })
    .catch(api.generateErrorHandler(res))
}

module.exports = {
  listLaundries: listLaundries,
  fetchLaundry: fetchLaundry,
  deleteLaundry: deleteLaundry,
  createLaundry: createLaundry
}
