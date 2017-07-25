// @flow
import TokenHandler from '../../handlers/token'
import UserHandler from '../../handlers/user'
import * as api from '../helper'
import { StatusError } from '../../utils/error'

async function listTokensAsync (since, limit, subjects) {
  const {currentUser} = api.assertSubjects({currentUser: subjects.currentUser})
  const filter: { owner: *, _id?: * } = {owner: currentUser.model._id}
  if (since) {
    filter._id = {$gt: since}
  }
  const summaries = (await TokenHandler.lib.find(filter, {limit, sort: {_id: 1}})).map(TokenHandler.restSummary)
  return {summaries, linkBase: '/api/tokens'}
}

async function _tokenExists (name, user) {
  const [t] = await TokenHandler.lib.find({name, owner: user.model._id})
  return t
}

async function createTokenAsync (subjects, params) { // TODO test
  const {user, createTokenBody} = api.assertSubjects({
    user: subjects.user,
    createTokenBody: params.createTokenBody
  })
  const {name, type} = createTokenBody
  const t = await _tokenExists(name, user)
  if (t) {
    throw new StatusError('Token already exists', 409, {Location: t.restUrl})
  }
  const token: TokenHandler = await (type === 'calendar'
    ? user.generateCalendarToken(name)
    : user.generateAuthToken(name))
  return token.toSecretRest()
}

async function verifyTokenAsync (subjects, params) { // TODO test
  const {user, verifyTokenBody} = api.assertSubjects({
    user: subjects.user,
    verifyTokenBody: params.verifyTokenBody
  })
  const {token, type} = verifyTokenBody
  const result = await (type === 'calendar'
    ? user.verifyCalendarToken(token)
    : user.verifyAuthToken(token))
  if (!result) {
    throw new StatusError('Invalid token', 400)
  }
}

async function fetchTokenAsync (subjects) {
  const {token} = api.assertSubjects({token: subjects.token})
  return token.toRest()
}

async function deleteTokenAsync (subs) {
  const {currentUser, token} = api.assertSubjects({currentUser: subs.currentUser, token: subs.token})
  await currentUser.removeAuthToken(token)
}

async function createTokenFromEmailPasswordAsync (subjects, p) {
  const {createTokenFromEmailPasswordBody} = api.assertSubjects({createTokenFromEmailPasswordBody: p.createTokenFromEmailPasswordBody})
  const {email, password, name} = createTokenFromEmailPasswordBody
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
export const listTokens = api.wrap(api.paginate(listTokensAsync), api.securityUserAccess)
export const createToken = api.wrap(createTokenAsync, api.securitySelf, api.securityWebApplication)
export const deleteToken = api.wrap(deleteTokenAsync, api.securityTokenOwner)
export const fetchToken = api.wrap(fetchTokenAsync, api.securityTokenOwner)
export const verifyToken = api.wrap(verifyTokenAsync, api.securitySelf, api.securityWebApplication)
