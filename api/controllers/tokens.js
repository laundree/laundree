/**
 * Created by budde on 02/06/16.
 */
const {TokenHandler} = require('../../handlers')
const {api} = require('../../utils')

function listTokens (req, res) {
  const filter = {owner: req.user.model._id}
  const limit = req.swagger.params.page_size.value
  const since = req.swagger.params.since.value
  if (since) {
    filter._id = {$gt: since}
  }
  TokenHandler.find(filter, {limit, sort: {_id: 1}})
    .then((tokens) => tokens.map((token) => token.toRestSummary()))
    .then((tokens) => {
      var links = {
        first: `/api/tokens?page_size=${limit}`
      }
      if (tokens.length === limit) {
        links.next = `/api/tokens?since=${tokens[tokens.length - 1].id}&page_size=${limit}`
      }
      res.links(links)
      res.json(tokens)
    })
    .catch(api.generateErrorHandler(res))
}

function createToken (req, res) {
  const name = req.swagger.params.body.value.name.trim()
  TokenHandler.find({name: name, owner: req.user.model._id})
    .then(([token]) => {
      if (token) return api.returnError(res, 409, 'Token already exists', {Location: token.restUrl})
      return req.user.generateAuthToken(name)
        .then((token) => api.returnSuccess(res, token.toRest().then((result) => {
          result.secret = token.secret
          return result
        })))
    })
    .catch(api.generateErrorHandler(res))
}

function fetchToken (req, res) {
  const id = req.swagger.params.id.value
  TokenHandler.findFromId(id)
    .then((token) => {
      if (!token) return api.returnError(res, 404, 'Token not found')
      if (!token.isOwner(req.user)) return api.returnError(res, 404, 'Token not found')
      api.returnSuccess(res, token.toRest())
    })
    .catch(api.generateErrorHandler(res))
}

function deleteToken (req, res) {
  const id = req.swagger.params.id.value
  TokenHandler.findFromId(id)
    .then((token) => {
      if (!token) return api.returnError(res, 404, 'Token not found')
      if (!token.isOwner(req.user)) return api.returnError(res, 404, 'Token not found')
      return req.user.removeAuthToken(token).then(() => api.returnSuccess(res))
    })
    .catch(api.generateErrorHandler(res))
}

module.exports = {
  listTokens: listTokens,
  createToken: createToken,
  deleteToken: deleteToken,
  fetchToken: fetchToken
}
