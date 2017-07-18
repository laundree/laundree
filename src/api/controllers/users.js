// @flow

import * as api from '../helper'
import * as mail from '../../utils/mail'
import {StatusError} from '../../utils/error'
import UserHandler from '../../handlers/user'
import type {LocaleType} from '../../locales'

function getUserF (subjects: {user: UserHandler}, params: {userId: string}) {
  const user = api.assert(subjects.user)
  return user.toRest()
}

async function listUsersF (subjects, params: {email?: string, page_size: number, since?: string}, req, res) {
  const filter = {}
  const email = params.email
  const limit = params.page_size
  if (email) {
    filter['profiles.emails.value'] = email.toLowerCase()
  }
  const since = params.since
  if (since) {
    filter._id = {$gt: since}
  }
  const users = await UserHandler.lib.find(filter, {limit, sort: {_id: 1}})
  const restUsers = users.map(u => u.toRestSummary())
  const links: { first: string, next?: string } = {
    first: `/api/users?page_size=${limit}`
  }
  if (restUsers.length === limit) {
    links.next = `/api/users?since=${restUsers[restUsers.length - 1].id}&page_size=${limit}`
  }
  res.links(links)
  return restUsers
}

async function createUserF (subjects, params: {email: string, displayName: string, password: string}) {
  const {email, displayName, password} = params
  const user = await UserHandler.lib.findFromEmail(email)
  if (user) {
    throw new StatusError('Email address already exists.', 409, {Location: user.restUrl})
  }
  const newUser = await UserHandler.lib.createUserWithPassword(displayName, email, password)
  return newUser.toRest()
}

async function startPasswordResetF (subjects: {user: UserHandler}, params: {userId: string, body?: {locale?: LocaleType}}) {
  const {user} = subjects
  const token = await user.generateResetToken()
  const locale = (params.body && params.body.locale) || 'en'
  await mail.sendEmail({
    user: {id: user.model.id, displayName: user.model.displayName},
    token: token.secret
  }, 'password-reset', user.model.emails[0], {locale})
}

async function passwordResetF (subjects: {user: UserHandler}, params: {userId: string, body: {token: string, password: string}}) {
  const {user} = subjects
  const {token, password} = params.body
  const result = await user.verifyResetPasswordToken(token)
  if (!result) {
    throw new StatusError('Invalid token', 400)
  }
  await user.resetPassword(password)
}

async function startEmailVerificationF (subjects: {user: UserHandler}, params: {userId: string, body: {email: string, locale?: LocaleType}}) {
  const {user} = subjects
  const email = params.body.email
  const token = await user.generateVerifyEmailToken(email)
  if (!token) {
    throw new StatusError('Invalid token', 400)
  }
  const locale = params.body.locale || 'en'
  await mail.sendEmail({
    email: email,
    emailEncoded: encodeURIComponent(email),
    token: token.secret,
    user: {id: user.model.id, displayName: user.model.displayName}
  }, 'verify-email', email, {locale})
}

async function verifyEmailF (subjects: {user: UserHandler}, params: {userId: string, body: {email: string, token: string}}) {
  const {user} = subjects
  const {email, token} = params.body
  const result = await user.verifyEmail(email, token)
  if (!result) {
    throw new StatusError('Invalid token', 400)
  }
}

async function deleteUserF (subjects: {user: UserHandler}, params: {userId: string}) {
  const {user} = subjects
  const laundries = await user.findOwnedLaundries()
  if (laundries.length) {
    throw new StatusError('Invalid token', 403)
  }
  await user.deleteUser()
}

async function updateUserF (subjects: {user: UserHandler}, params: {userId: string, body: {name?: string}}) {
  const {user} = subjects
  const {name} = params.body
  if (!name) return
  await user.updateName(name)
}

async function changeUserPasswordF ({user}: {user: UserHandler}, params: {userId: string, body: {currentPassword: string, newPassword: string}}) {
  const {currentPassword, newPassword} = params.body
  let result = true
  if (user.hasPassword()) {
    result = await user.verifyPassword(currentPassword)
  }
  if (!result) {
    throw new StatusError('Invalid current password', 403)
  }
  await user.resetPassword(newPassword)
}

async function addOneSignalPlayerIdF ({user}: {user: UserHandler}, {body: {playerId}}: {userId: string, body: {playerId: string}}) {
  await user.addOneSignalPlayerId(playerId)
}

function fetchUserEmailsF ({user}: {user: UserHandler}) {
  return user.model.emails
}

export const getUser = api.wrap(getUserF, api.securityNoop)
export const listUsers = api.wrap(listUsersF, api.securityNoop)
export const createUser = api.wrap(createUserF, api.securityNoop)
export const startPasswordReset = api.wrap(startPasswordResetF, api.securityNoop)
export const passwordReset = api.wrap(passwordResetF, api.securityNoop)
export const startEmailVerification = api.wrap(startEmailVerificationF, api.securityNoop)
export const verifyEmail = api.wrap(verifyEmailF, api.securityNoop)
export const deleteUser = api.wrap(deleteUserF, api.securitySelf, api.securityAdministrator)
export const updateUser = api.wrap(updateUserF, api.securitySelf, api.securityAdministrator)
export const changeUserPassword = api.wrap(changeUserPasswordF, api.securitySelf)
export const fetchUserEmails = api.wrap(fetchUserEmailsF, api.securitySelf, api.securityAdministrator)
export const addOneSignalPlayerId = api.wrap(addOneSignalPlayerIdF, api.securitySelf)

