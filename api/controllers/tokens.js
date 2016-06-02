/**
 * Created by budde on 02/06/16.
 */
const {TokenHandler} = require('../../handlers')
const utils = require('../../utils')

function listTokens (req, res) {
  var filter = {owner: req.user.model._id}
  var limit = req.swagger.params.page_size.value
  var since = req.swagger.params.since.value
  if (since) {
    filter._id = {$gt: since}
  }
  TokenHandler.find(filter, limit)
    .then((tokens) => tokens.map((token) => token.toRestSummary()))
    .then((tokens) => {
      var links = {
        first: `/api/users?page_size=${limit}`
      }
      if (tokens.length === limit) {
        links.next = `/api/users?since=${tokens[tokens.length - 1].id}&page_size=${limit}`
      }
      res.links(links)
      res.json(tokens)
    })
    .catch(utils.api.generateErrorHandler(res))
}

function createToken (req, res) {
  res.end()
}

module.exports = {
  listTokens: listTokens,
  createToken: createToken
}
