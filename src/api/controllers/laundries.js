// @flow

import LaundryHandler from '../../handlers/laundry'
import UserHandler from '../../handlers/user'
import * as api from '../../utils/api'
import * as mail from '../../utils/mail'

/**
 * Created by budde on 02/06/16.
 */

async function listLaundriesAsync (req, res) {
  const {currentUser} = req.subjects
  const filter = {}
  if (!currentUser.isAdmin()) {
    filter.users = currentUser.model._id
  }
  const limit = req.swagger.params.page_size.value
  const since = req.swagger.params.since.value
  if (since) {
    filter._id = {$gt: since}
  }
  const laundries = await LaundryHandler.lib.find(filter, {limit, sort: {_id: 1}})
  const summarizedLaundries = laundries.map((laundry) => laundry.toRestSummary())
  const links: { first: string, next?: string } = {
    first: `/api/laundries?page_size=${limit}`
  }
  if (laundries.length === limit) {
    links.next = `/api/laundries?since=${summarizedLaundries[laundries.length - 1].id}&page_size=${limit}`
  }
  res.links(links)
  res.json(summarizedLaundries)
}

async function createLaundryAsync (req, res) {
  const {name, googlePlaceId} = req.swagger.params.body.value
  const {currentUser} = req.subjects
  if (currentUser.isDemo()) {
    return api.returnError(res, 403, 'Not allowed')
  }
  const timezone = await LaundryHandler
    .lib
    .timeZoneFromGooglePlaceId(googlePlaceId)

  if (!timezone) {
    return api.returnError(res, 400, 'Invalid place-id')
  }
  const [l] = await LaundryHandler
    .lib
    .find({name: name.trim()})

  if (l) {
    return api.returnError(res, 409, 'Laundry already exists', {Location: l.restUrl})
  }
  const laundry = await req.user.createLaundry(name.trim(), timezone, googlePlaceId)
  api.returnSuccess(res, laundry.toRest())
}

async function createDemoLaundryAsync (req, res) {
  const {user, email, password} = await UserHandler
    .lib
    .createDemoUser()
  await LaundryHandler
    .lib
    .createDemoLaundry(user)
  api.returnSuccess(res, {email, password})
}

function sanitizeBody ({name, rules, googlePlaceId}) {
  const updateObject = {}
  if (googlePlaceId && googlePlaceId.trim()) {
    updateObject.googlePlaceId = googlePlaceId.trim()
  }
  if (name && name.trim()) {
    updateObject.name = name.trim()
  }
  if (rules) {
    updateObject.rules = rules
  }
  return updateObject
}

function timeToMinutes ({hour, minute}) {
  return hour * 60 + minute
}

async function validateLaundryName (res, laundry, body) {
  const {name} = body
  if (!name || name === laundry.model.name) return body
  const [l] = await LaundryHandler
    .lib
    .find({name})
  if (l) {
    api.returnError(res, 409, 'Laundry already exists', {Location: l.restUrl})
    return null
  }
  return body
}

async function validateGooglePlaceId (res, laundry, body) {
  const {googlePlaceId} = body
  if (!googlePlaceId || googlePlaceId === laundry.model.googlePlaceId) return body
  const timeZone = await LaundryHandler.lib.timeZoneFromGooglePlaceId(googlePlaceId)
  if (!timeZone) {
    api.returnError(res, 400, 'Invalid place-id')
    return null
  }
  body.timezone = timeZone
  return body
}

function validateRules (res, body) {
  const {rules} = body
  if (!rules || !rules.timeLimit) return body
  if (timeToMinutes(rules.timeLimit.from) < timeToMinutes(rules.timeLimit.to)) return body
  api.returnError(res, 400, 'From must be before to')
  return null
}

async function validateBody (res, laundry, body) {
  const b2 = validateRules(res, body)
  if (!b2) {
    return b2
  }
  const b3 = await validateLaundryName(res, laundry, b2)
  if (!b3) {
    return b3
  }
  return validateGooglePlaceId(res, laundry, b3)
}

async function updateLaundryAsync (req, res) {
  const {laundry} = req.subjects
  let body = req.swagger.params.body.value
  const result = await validateBody(res, laundry, sanitizeBody(body))
  if (!result) return
  await laundry.updateLaundry(result)
  api.returnSuccess(res)
}

function fetchLaundryAsync (req, res) {
  const laundry = req.subjects.laundry
  api.returnSuccess(res, laundry.toRest())
}

async function deleteLaundryAsync (req, res) {
  const {laundry, currentUser} = req.subjects
  if (!currentUser.isAdmin() && laundry.isDemo()) {
    return api.returnError(res, 403, 'Not allowed')
  }
  await laundry.deleteLaundry()
  api.returnSuccess(res)
}

async function inviteUserByEmailAsync (req, res) {
  const email = req.swagger.params.body.value.email
  const laundry = req.subjects.laundry
  if (laundry.isDemo()) return api.returnError(res, 403, 'Not allowed')
  const {user, invite} = await laundry.inviteUserByEmail(email)
  if (user) {
    mail.sendEmail({
      email,
      laundry: laundry.model.toObject(),
      user: {displayName: user.model.displayName, id: user.model.id}
    }, 'invite-user', email, {locale: req.locale})
  } else if (invite) {
    mail.sendEmail({
      email,
      laundry: laundry.model.toObject()
    }, 'invite', email, {locale: req.locale})
  }
  api.returnSuccess(res)
}

async function removeUserFromLaundryAsync (req, res) {
  const {user, laundry} = req.subjects
  if (!laundry.isUser(user)) {
    return api.returnError(res, 403, 'Not allowed')
  }
  if (laundry.isOwner(user)) {
    return api.returnError(res, 403, 'Not allowed')
  }
  await laundry.removeUser(user)
  api.returnSuccess(res)
}

async function createInviteCodeAsync (req, res) {
  const {laundry} = req.subjects
  if (laundry.model.demo) {
    return api.returnError(res, 403, 'Not allowed')
  }
  const key = await laundry.createInviteCode()
  api.returnSuccess(res, {
    key,
    href: `https://laundree.io/s/${laundry.shortId()}/${key}`
  })
}

async function addOwnerAsync (req, res) {
  const {laundry, user} = req.subjects
  if (!laundry.isUser(user) || laundry.isOwner(user)) {
    return api.returnError(res, 403, 'Not allowed')
  }
  await laundry.addOwner(user)
  api.returnSuccess(res)
}

async function removeOwnerAsync (req, res) {
  const {laundry, user} = req.subjects
  if (!laundry.isOwner(user)) {
    return api.returnError(res, 403, 'Not allowed')
  }
  if (!laundry.model.owners.find(id => !id.equals(user.model._id))) {
    return api.returnError(res, 403, 'Not allowed')
  }
  laundry.removeOwner(user)
    .then(() => api.returnSuccess(res))
    .catch(api.generateErrorHandler(res))
}

async function addUserFromCodeAsync (req, res) {
  const {laundry, currentUser} = req.subjects
  const {key} = req.swagger.params.body.value
  const result = await laundry
    .verifyInviteCode(key)
  if (!result) return api.returnError(res, 400, 'Invalid key')
  await laundry.addUser(currentUser)
  api.returnSuccess(res)
}

export const addUserFromCode = api.wrapErrorHandler(addUserFromCodeAsync)
export const createDemoLaundry = api.wrapErrorHandler(createDemoLaundryAsync)
export const inviteUserByEmail = api.wrapErrorHandler(inviteUserByEmailAsync)
export const listLaundries = api.wrapErrorHandler(listLaundriesAsync)
export const updateLaundry = api.wrapErrorHandler(updateLaundryAsync)
export const fetchLaundry = api.wrapErrorHandler(fetchLaundryAsync)
export const deleteLaundry = api.wrapErrorHandler(deleteLaundryAsync)
export const createLaundry = api.wrapErrorHandler(createLaundryAsync)
export const removeUserFromLaundry = api.wrapErrorHandler(removeUserFromLaundryAsync)
export const createInviteCode = api.wrapErrorHandler(createInviteCodeAsync)
export const addOwner = api.wrapErrorHandler(addOwnerAsync)
export const removeOwner = api.wrapErrorHandler(removeOwnerAsync)
