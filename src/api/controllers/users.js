// @flow

import * as api from '../helper'
import * as mail from '../../utils/mail'
import { StatusError } from '../../utils/error'
import UserHandler from '../../handlers/user'
import TokenHandler from '../../handlers/token'

async function getUserF (subjects) {
  const user = api.assert(subjects.user)
  return user.toRest()
}

async function listUsersF (since, limit, s, params) {
  const filter = {}
  const email = params.email
  if (email) {
    filter['profiles.emails.value'] = email.toLowerCase()
  }
  if (since) {
    filter._id = {$gt: since}
  }
  const users = await UserHandler.lib.find(filter, {limit, sort: {_id: 1}})
  const summaries = users.map(UserHandler.restSummary)
  return {summaries, linkBase: '/api/users'}
}

async function createUserFromProfileF (s, p) { // TODO test
  const {createUserFromProfileBody} = api.assertSubjects({
    createUserFromProfileBody: p.createUserFromProfileBody
  })
  const user = await UserHandler.lib.findOrCreateFromProfile(createUserFromProfileBody)
  return user.toRest()
}

async function validateCredentialsF (s, p) { // TODO test
  const {validateCredentialsBody} = api.assertSubjects({
    validateCredentialsBody: p.validateCredentialsBody
  })
  const {email, password} = validateCredentialsBody
  const user = await UserHandler.lib.findFromEmail(email)
  if (!user) {
    throw new StatusError('User not found', 404)
  }
  const validPassword = await user.verifyPassword(password)
  if (!validPassword) {
    throw new StatusError('User not found', 404)
  }
  return {
    userId: user.model.id,
    emailVerified: user.isVerified(email)
  }
}

async function createUserF (subjects, p) {
  const {createUserBody} = api.assertSubjects({
    createUserBody: p.createUserBody
  })
  const {email, displayName, password} = createUserBody
  const user = await UserHandler.lib.findFromEmail(email)
  if (user) {
    throw new StatusError('Email address already exists.', 409, {Location: user.restUrl})
  }
  const newUser = await UserHandler.lib.createUserWithPassword(displayName, email, password)
  return newUser.toRest()
}

async function startPasswordResetF (subjects, params) {
  const {user} = api.assertSubjects({user: subjects.user})
  const token = await user.generateResetToken()
  const locale = (params.startPasswordResetBody && params.startPasswordResetBody.locale) || 'en'
  await mail.sendEmail({
    user: {id: user.model.id, displayName: user.model.displayName},
    token: token.secret
  }, 'password-reset', user.model.emails[0], {locale})
}

async function passwordResetF (subjects, params) {
  const {user, passwordResetBody} = api.assertSubjects({
    user: subjects.user,
    passwordResetBody: params.passwordResetBody
  })
  const {token, password} = passwordResetBody
  const result = await user.verifyResetPasswordToken(token)
  if (!result) {
    throw new StatusError('Invalid token', 400)
  }
  await user.resetPassword(password)
}

async function startEmailVerificationF (subjects, params) {
  const {user, startEmailVerificationBody} = api.assertSubjects({
    user: subjects.user,
    startEmailVerificationBody: params.startEmailVerificationBody
  })
  const email = startEmailVerificationBody.email
  const token = await user.generateVerifyEmailToken(email)
  if (!token) {
    throw new StatusError('Invalid token', 400)
  }
  const locale = startEmailVerificationBody.locale || 'en'
  await mail.sendEmail({
    email: email,
    emailEncoded: encodeURIComponent(email),
    token: token.secret,
    user: {id: user.model.id, displayName: user.model.displayName}
  }, 'verify-email', email, {locale})
}

async function verifyEmailF (subjects, params) {
  const {user, verifyEmailBody} = api.assertSubjects({user: subjects.user, verifyEmailBody: params.verifyEmailBody})
  const {email, token} = verifyEmailBody
  const result = await user.verifyEmail(email, token)
  if (!result) {
    throw new StatusError('Invalid token', 400)
  }
}

async function deleteUserF (subjects) {
  const {user} = api.assertSubjects({user: subjects.user})
  const laundries = await user.findOwnedLaundries()
  if (laundries.length) {
    throw new StatusError('Not allowed', 403)
  }
  await user.deleteUser()
}

async function updateUserF (subjects, params) {
  const {user, updateUserBody} = api.assertSubjects({user: subjects.user, updateUserBody: params.updateUserBody})
  await user.update(updateUserBody)
  return user.toRest()
}

async function changeUserPasswordF (subjects, params) {
  const {user, changeUserPasswordBody} = api.assertSubjects({
    user: subjects.user,
    changeUserPasswordBody: params.changeUserPasswordBody
  })
  const {currentPassword, newPassword} = changeUserPasswordBody
  let result = true
  if (user.hasPassword()) {
    result = await user.verifyPassword(currentPassword)
  }
  if (!result) {
    throw new StatusError('Invalid current password', 403)
  }
  await user.resetPassword(newPassword)
}

async function addOneSignalPlayerIdF (subjects, p) {
  const {user, addOneSignalPlayerIdBody} = api.assertSubjects({
    user: subjects.user,
    addOneSignalPlayerIdBody: p.addOneSignalPlayerIdBody
  })
  await user.addOneSignalPlayerId(addOneSignalPlayerIdBody.playerId)
}

function fetchUserEmailsF (subjects) {
  const {user} = api.assertSubjects({user: subjects.user})
  return user.model.emails
}

async function _tokenExists (name, user) {
  const [t] = await TokenHandler.lib.find({name, owner: user.model._id})
  return t
}

async function createTokenF (subjects, params) { // TODO test
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

export const getUser = api.wrap(getUserF, api.securityNoop)
export const listUsers = api.wrap(api.paginate(listUsersF), api.securityNoop)
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
export const createUserFromProfile = api.wrap(createUserFromProfileF, api.securityWebApplication)
export const validateCredentials = api.wrap(validateCredentialsF, api.securityWebApplication)
export const createToken = api.wrap(createTokenF, api.securitySelf, api.securityWebApplication)
