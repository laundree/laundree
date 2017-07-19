// @flow
import TokenHandler from '../../handlers/token'
import UserHandler from '../../handlers/user'
import * as api from '../helper'
import {StatusError} from '../../utils/error'

async function listTokensAsync (subjects, params: {page_size: number, since?: string}, req, res) {
  const {currentUser} = api.assertSubjects({currentUser: subjects.currentUser})
  const filter: { owner: *, _id?: * } = {owner: currentUser.model._id}
  const limit = params.page_size
  const since = params.since
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
  return tokens
}

async function _tokenExists (name, user) {
  const [t] = await TokenHandler.lib.find({name, owner: user.model._id})
  return t
}

async function createTokenAsync (subjects, params: {body: {name: string}}) {
  const {currentUser} = api.assertSubjects({currentUser: subjects.currentUser})
  const name = params.body.name
  const t = await _tokenExists(name, currentUser)
  if (t) {
    throw new StatusError('Token already exists', 409, {Location: t.restUrl})
  }
  const token: TokenHandler = await currentUser.generateAuthToken(name)
  return token.toSecretRest()
}

async function fetchTokenAsync (subjects) {
  const {token} = api.assertSubjects({token: subjects.token})
  return token.toRest()
}

async function deleteTokenAsync (subs) {
  const {currentUser, token} = api.assertSubjects({currentUser: subs.currentUser, token: subs.token})
  await currentUser.removeAuthToken(token)
}

async function createTokenFromEmailPasswordAsync (subjects, params: {body: {name: string, email: string, password: string}}) {
  const {email, password, name} = params.body
  const user = await UserHandler.lib.findFromVerifiedEmailAndVerifyPassword(email, password)
  if (!user) {
    throw new StatusError('Unauthorized', 403)
  }
  const t = await _tokenExists(name, user)
  if (t) {
    throw new StatusError('Token already exists', 409, {Location: t.restUrl})
  }
  const token = await user.generateAuthToken(name)
  return token.toSecretRest()
}

export const createTokenFromEmailPassword = api.wrap(createTokenFromEmailPasswordAsync, api.securityNoop)
export const listTokens = api.wrap(listTokensAsync, api.securityUserAccess)
export const createToken = api.wrap(createTokenAsync, api.securityUserAccess)
export const deleteToken = api.wrap(deleteTokenAsync, api.securityTokenOwner)
export const fetchToken = api.wrap(fetchTokenAsync, api.securityTokenOwner)
