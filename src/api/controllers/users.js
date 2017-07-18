// @flow

import * as api from '../helper'
import * as mail from '../../utils/mail'
import UserHandler from '../../handlers/user'

function getUserF (req, res) {
  const {user} = req.subjects
  return api.returnSuccess(res, user.toRest())
}

async function listUsersF (req, res) {
  const filter = {}
  const email = req.swagger.params.email.value
  const limit = req.swagger.params.page_size.value
  if (email) {
    filter['profiles.emails.value'] = email.toLowerCase()
  }
  const since = req.swagger.params.since.value
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
  res.json(restUsers)
}

async function createUserF (req, res) {
  const {email, displayName, password} = req.swagger.params.body.value
  const user = await UserHandler.lib.findFromEmail(email)
  if (user) {
    return api.returnError(res, 409, 'Email address already exists.', {Location: user.restUrl})
  }
  const newUser = await UserHandler.lib.createUserWithPassword(displayName, email, password)
  return api.returnSuccess(res, newUser.toRest())
}

async function startPasswordResetF (req, res) {
  const {user} = req.subjects
  const token = await user.generateResetToken()
  await mail.sendEmail({
    user: {id: user.model.id, displayName: user.model.displayName},
    token: token.secret
  }, 'password-reset', user.model.emails[0], {locale: req.locale})
  return api.returnSuccess(res)
}

async function passwordResetF (req, res) {
  const {user} = req.subjects
  const body = req.swagger.params.body.value
  const token = body.token
  const password = body.password
  const result = await user.verifyResetPasswordToken(token)
  if (!result) {
    return api.returnError(res, 400, 'Invalid token')
  }
  await user.resetPassword(password)
  return api.returnSuccess(res)
}

async function startEmailVerificationF (req, res) {
  const {user} = req.subjects
  const email = req.swagger.params.body.value.email
  const token = await user.generateVerifyEmailToken(email)
  if (!token) {
    return api.returnError(res, 400, 'Invalid email')
  }
  await mail.sendEmail({
    email: email,
    emailEncoded: encodeURIComponent(email),
    token: token.secret,
    user: {id: user.model.id, displayName: user.model.displayName}
  }, 'verify-email', email, {locale: req.locale})
  return api.returnSuccess(res)
}

async function verifyEmailF (req, res) {
  const {user} = req.subjects
  const {email, token} = req.swagger.params.body.value
  const result = await user.verifyEmail(email, token)
  if (!result) {
    return api.returnError(res, 400, 'Invalid token')
  }
  return api.returnSuccess(res)
}

async function deleteUserF (req, res) {
  const user = req.subjects.user
  const laundries = await user.findOwnedLaundries()
  if (laundries.length) {
    return api.returnError(res, 403, 'Not allowed')
  }
  return user.deleteUser().then(() => api.returnSuccess(res))
}

async function updateUserF (req, res) {
  const user = req.subjects.user
  const {name} = req.swagger.params.body.value
  await user.updateName(name)
  return api.returnSuccess(res)
}

async function changeUserPasswordF (req, res) {
  const {currentPassword, newPassword} = req.swagger.params.body.value
  const user = req.subjects.user
  let result = true
  if (user.hasPassword()) {
    result = await user.verifyPassword(currentPassword)
  }
  if (!result) {
    return api.returnError(res, 403, 'Invalid current password')
  }
  await user.resetPassword(newPassword)
  return api.returnSuccess(res)
}

async function addOneSignalPlayerIdF (req, res) {
  const {user} = req.subjects
  const {playerId} = req.swagger.params.body.value
  await user.addOneSignalPlayerId(playerId)
  return api.returnSuccess(res)
}

function fetchUserEmailsF (req, res) {
  const {user} = req.subjects
  return api.returnSuccess(res, user.model.emails)
}

export const getUser = api.wrapErrorHandler(getUserF)
export const listUsers = api.wrapErrorHandler(listUsersF)
export const createUser = api.wrapErrorHandler(createUserF)
export const startPasswordReset = api.wrapErrorHandler(startPasswordResetF)
export const passwordReset = api.wrapErrorHandler(passwordResetF)
export const startEmailVerification = api.wrapErrorHandler(startEmailVerificationF)
export const verifyEmail = api.wrapErrorHandler(verifyEmailF)
export const deleteUser = api.wrapErrorHandler(deleteUserF)
export const updateUser = api.wrapErrorHandler(updateUserF)
export const changeUserPassword = api.wrapErrorHandler(changeUserPasswordF)
export const fetchUserEmails = api.wrapErrorHandler(fetchUserEmailsF)
export const addOneSignalPlayerId = api.wrapErrorHandler(addOneSignalPlayerIdF)

