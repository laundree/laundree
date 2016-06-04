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
  res.end()
}

module.exports = {
  listLaundries: listLaundries,
  createLaundry: createLaundry
}
