/**
 * Created by budde on 02/06/16.
 */
const TokenHandler = require('../../handlers/token')
const UserHandler = require('../../handlers/user')
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
      const links = {
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

function _tokenExists (name, user) {
  return TokenHandler.find({name, owner: user.model._id})
    .then(([token]) => token)
}

function createToken (req, res) {
  const name = req.swagger.params.body.value.name.trim()
  _tokenExists(name, req.user)
    .then(token => {
      if (token) return api.returnError(res, 409, 'Token already exists', {Location: token.restUrl})
      return req.user.generateAuthToken(name)
        .then(token => api.returnSuccess(res, token.toSecretRest()))
    })
    .catch(api.generateErrorHandler(res))
}

function fetchToken (req, res) {
  api.returnSuccess(res, req.subjects.token.toRest())
}

function deleteToken (req, res) {
  req.user.removeAuthToken(req.subjects.token)
    .then(() => api.returnSuccess(res))
    .catch(api.generateErrorHandler(res))
}

function createTokenFromEmailPassword (req, res) {
  const {email, password, name} = req.swagger.params.body.value
  return UserHandler.findFromVerifiedEmailAndVerifyPassword(email, password)
    .then(user => {
      if (!user) return api.returnError(res, 403, 'Unauthorized')
      return _tokenExists(name, user)
        .then(token => {
          if (token) return api.returnError(res, 409, 'Token already exists', {Location: token.restUrl})
          return user.generateAuthToken(name).then(token => api.returnSuccess(res, token.toSecretRest()))
        })
    })
    .catch(api.generateErrorHandler(res))
}

module.exports = {
  createTokenFromEmailPassword,
  listTokens,
  createToken,
  deleteToken,
  fetchToken
}
