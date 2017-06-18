// @flow
import TokenHandler from '../../handlers/token'
import UserHandler from '../../handlers/user'
import * as api from '../../utils/api'

async function listTokensAsync (req, res) {
  const filter: { owner: *, _id?: * } = {owner: req.user.model._id}
  const limit = req.swagger.params.page_size.value
  const since = req.swagger.params.since.value
  if (since) {
    filter._id = {$gt: since}
  }
  const tokens = (await TokenHandler.lib.find(filter, {limit, sort: {_id: 1}})).map((token) => token.toRestSummary())
  const links: { first: string, next?: string } = {
    first: `/api/tokens?page_size=${limit}`
  }
  if (tokens.length === limit) {
    links.next = `/api/tokens?since=${tokens[tokens.length - 1].id}&page_size=${limit}`
  }
  res.links(links)
  res.json(tokens)
}

async function _tokenExists (name, user) {
  const [t] = await TokenHandler.lib.find({name, owner: user.model._id})
  return t
}

async function createTokenAsync (req, res) {
  const name = req.swagger.params.body.value.name.trim()
  const t = await _tokenExists(name, req.user)
  if (t) return api.returnError(res, 409, 'Token already exists', {Location: t.restUrl})
  const token: TokenHandler = await req.user.generateAuthToken(name)
  api.returnSuccess(res, token.toSecretRest())
}

function fetchTokenAsync (req, res) {
  api.returnSuccess(res, req.subjects.token.toRest())
}

async function deleteTokenAsync (req, res) {
  await req.user.removeAuthToken(req.subjects.token)
  api.returnSuccess(res)
}

async function createTokenFromEmailPasswordAsync (req, res) {
  const {email, password, name} = req.swagger.params.body.value
  const user = await UserHandler.lib.findFromVerifiedEmailAndVerifyPassword(email, password)
  if (!user) {
    return api.returnError(res, 403, 'Unauthorized')
  }
  const t = await _tokenExists(name, user)
  if (t) return api.returnError(res, 409, 'Token already exists', {Location: t.restUrl})
  const token = await user.generateAuthToken(name)
  api.returnSuccess(res, token.toSecretRest())
}

export const createTokenFromEmailPassword = api.wrapErrorHandler(createTokenFromEmailPasswordAsync)
export const listTokens = api.wrapErrorHandler(listTokensAsync)
export const createToken = api.wrapErrorHandler(createTokenAsync)
export const deleteToken = api.wrapErrorHandler(deleteTokenAsync)
export const fetchToken = api.wrapErrorHandler(fetchTokenAsync)
