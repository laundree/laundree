// @flow

import LaundryHandler from '../../handlers/laundry'
import UserHandler from '../../handlers/user'
import * as api from '../helper'
import * as mail from '../../utils/mail'
import { StatusError, logError } from '../../utils/error'

/**
 * Created by budde on 02/06/16.
 */

async function listLaundriesAsync (subjects, params, req, res) {
  const {currentUser, limit} = api.assertSubjects({currentUser: subjects.currentUser, limit: params.page_size})
  const filter = {}
  if (!currentUser.isAdmin()) {
    filter.users = currentUser.model._id
  }

  const {since} = params

  if (since) {
    filter._id = {$gt: since}
  }
  const laundries = await LaundryHandler.lib.find(filter, {limit, sort: {_id: 1}})
  const summarizedLaundries = laundries.map(LaundryHandler.restSummary)
  const links: { first: string, next?: string } = {
    first: `/api/laundries?page_size=${limit}`
  }
  if (laundries.length === limit) {
    links.next = `/api/laundries?since=${summarizedLaundries[laundries.length - 1].id}&page_size=${limit}`
  }
  res.links(links)
  return summarizedLaundries
}

async function createLaundryAsync (subjects, params) {
  const {currentUser, createLaundryBody} = api.assertSubjects({createLaundryBody: params.createLaundryBody, currentUser: subjects.currentUser})
  const {name, googlePlaceId} = createLaundryBody
  if (currentUser.isDemo()) {
    throw new StatusError('Not allowed', 403)
  }
  const timezone = await LaundryHandler
    .lib
    .timeZoneFromGooglePlaceId(googlePlaceId)

  if (!timezone) {
    throw new StatusError('Invalid place-id', 400)
  }
  const [l] = await LaundryHandler
    .lib
    .find({name: name.trim()})

  if (l) {
    throw new StatusError('Laundry already exists', 409, {Location: l.restUrl})
  }
  const laundry = await currentUser.createLaundry(name.trim(), timezone, googlePlaceId)
  return laundry.toRest()
}

async function createDemoLaundryAsync () {
  const {user, email, password} = await UserHandler
    .lib
    .createDemoUser()
  await LaundryHandler
    .lib
    .createDemoLaundry(user)
  return {email, password}
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

async function validateLaundryName (laundry, body) {
  const {name} = body
  if (!name || name === laundry.model.name) {
    return
  }
  const [l] = await LaundryHandler
    .lib
    .find({name})
  if (!l) return
  throw new StatusError('Laundry already exists', 409, {Location: l.restUrl})
}

async function validateGooglePlaceId (laundry, body) {
  const {googlePlaceId} = body
  if (!googlePlaceId || googlePlaceId === laundry.model.googlePlaceId) return null
  const timeZone = await LaundryHandler.lib.timeZoneFromGooglePlaceId(googlePlaceId)
  if (timeZone) {
    return timeZone
  }
  throw new StatusError('Invalid place-id', 400)
}

function validateRules (body) {
  const {rules} = body
  if (!rules || !rules.timeLimit) return
  const {from, to} = rules.timeLimit
  if (timeToMinutes(from) < timeToMinutes(to)) return
  throw new StatusError('From must be before to', 400)
}

async function updateLaundryAsync (subs, params) {
  const {updateLaundryBody, laundry} = api.assertSubjects({laundry: subs.laundry, updateLaundryBody: params.updateLaundryBody})
  const body = sanitizeBody(updateLaundryBody)
  validateRules(body)
  await validateLaundryName(laundry, body)
  const timezone = await validateGooglePlaceId(laundry, body)
  const newBody = timezone ? {...body, timezone} : body
  await laundry.updateLaundry(newBody)
  return laundry.toRest()
}

function fetchLaundryAsync (subs) {
  const {laundry} = api.assertSubjects({laundry: subs.laundry})
  return laundry.toRest()
}

async function deleteLaundryAsync (subs) {
  const {laundry, currentUser} = api.assertSubjects({laundry: subs.laundry, currentUser: subs.currentUser})
  if (!currentUser.isAdmin() && laundry.isDemo()) {
    throw new StatusError('Not allowed', 403)
  }
  await laundry.deleteLaundry()
}

async function inviteUserByEmailAsync (subs, params) {
  const {laundry, inviteUserByEmailBody} = api.assertSubjects({laundry: subs.laundry, inviteUserByEmailBody: params.inviteUserByEmailBody})
  const email = inviteUserByEmailBody.email
  const locale = inviteUserByEmailBody.locale || 'en'
  if (laundry.isDemo()) {
    throw new StatusError('Not allowed', 403)
  }
  const {user, invite} = await laundry.inviteUserByEmail(email)
  if (user) {
    mail
      .sendEmail({
        email,
        laundry: laundry.model.toObject(),
        user: {displayName: user.model.displayName, id: user.model.id}
      }, 'invite-user', email, {locale})
      .catch(logError)
  } else if (invite) {
    mail
      .sendEmail({
        email,
        laundry: laundry.model.toObject()
      }, 'invite', email, {locale})
      .catch(logError)
  }
}

async function removeUserFromLaundryAsync (subs) {
  const {user, laundry} = api.assertSubjects({laundry: subs.laundry, user: subs.user})
  if (!laundry.isUser(user)) {
    throw new StatusError('Not allowed', 403)
  }
  if (laundry.isOwner(user)) {
    throw new StatusError('Not allowed', 403)
  }
  await laundry.removeUser(user)
}

async function createInviteCodeAsync (subs) {
  const {laundry} = api.assertSubjects({laundry: subs.laundry})
  if (laundry.model.demo) {
    throw new StatusError('Not allowed', 403)
  }
  const key = await laundry.createInviteCode()
  return {
    key,
    href: `https://laundree.io/s/${laundry.shortId()}/${key}`
  }
}

async function verifyInviteCodeAsync (subs, p) {
  const {laundry, verifyInviteCodeBody} = api.assertSubjects({laundry: subs.laundry, verifyInviteCodeBody: p.verifyInviteCodeBody})
  const result = await laundry.verifyInviteCode(verifyInviteCodeBody.key)
  if (!result) {
    throw new StatusError('Not found', 404)
  }
}

async function addOwnerAsync (subs) {
  const {user, laundry} = api.assertSubjects({laundry: subs.laundry, user: subs.user})
  if (!laundry.isUser(user) || laundry.isOwner(user)) {
    throw new StatusError('Not allowed', 403)
  }
  await laundry.addOwner(user)
}

async function addUserToLaundryAsync (subs) { // TODO test
  const {user, laundry} = api.assertSubjects({laundry: subs.laundry, user: subs.user})
  if (laundry.isUser(user)) {
    throw new StatusError('Not allowed', 403)
  }
  await laundry.addUser(user)
}

async function removeOwnerAsync (subs) {
  const {user, laundry} = api.assertSubjects({laundry: subs.laundry, user: subs.user})
  if (!laundry.isOwner(user)) {
    throw new StatusError('Not allowed', 403)
  }
  if (!laundry.model.owners.find(id => !id.equals(user.model._id))) {
    throw new StatusError('Not allowed', 403)
  }
  await laundry.removeOwner(user)
}

async function addUserFromCodeAsync (subs, params) {
  const {addUserFromCodeBody, laundry, currentUser} = api.assertSubjects({addUserFromCodeBody: params.addUserFromCodeBody, laundry: subs.laundry, currentUser: subs.currentUser})
  const {key} = addUserFromCodeBody
  const result = await laundry.verifyInviteCode(key)
  if (!result) {
    throw new StatusError('Invalid key', 400)
  }
  await laundry.addUser(currentUser)
}

export const addUserFromCode = api.wrap(addUserFromCodeAsync, api.securityUserAccess)
export const createDemoLaundry = api.wrap(createDemoLaundryAsync, api.securityNoop)
export const inviteUserByEmail = api.wrap(inviteUserByEmailAsync, api.securityLaundryOwner, api.securityAdministrator)
export const listLaundries = api.wrap(listLaundriesAsync, api.securityUserAccess)
export const updateLaundry = api.wrap(updateLaundryAsync, api.securityLaundryOwner, api.securityAdministrator)
export const fetchLaundry = api.wrap(fetchLaundryAsync, api.securityLaundryUser, api.securityAdministrator)
export const deleteLaundry = api.wrap(deleteLaundryAsync, api.securityLaundryOwner, api.securityAdministrator)
export const createLaundry = api.wrap(createLaundryAsync, api.securityUserAccess)
export const removeUserFromLaundry = api.wrap(removeUserFromLaundryAsync, api.securityLaundryOwner, api.securityAdministrator, api.securitySelf)
export const createInviteCode = api.wrap(createInviteCodeAsync, api.securityLaundryOwner, api.securityAdministrator)
export const addOwner = api.wrap(addOwnerAsync, api.securityLaundryOwner, api.securityAdministrator)
export const addUserToLaundry = api.wrap(addUserToLaundryAsync, api.securityWebApplication)
export const removeOwner = api.wrap(removeOwnerAsync, api.securityLaundryOwner, api.securityAdministrator)
export const verifyInviteCode = api.wrap(verifyInviteCodeAsync, api.securityWebApplication)
