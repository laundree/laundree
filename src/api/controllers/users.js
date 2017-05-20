/**
 * Created by budde on 05/05/16.
 */

const utils = require('../../utils')

const UserHandler = require('../../handlers/user')

function getUser (req, res) {
  const {user} = req.subjects
  return utils.api.returnSuccess(res, user.toRest())
}

async function listUsers (req, res) {
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
  const users = await UserHandler.find(filter, {limit, sort: {_id: 1}})
  const restUsers = users.map(u => u.toRestSummary())
  const links = {
    first: `/api/users?page_size=${limit}`
  }
  if (restUsers.length === limit) {
    links.next = `/api/users?since=${restUsers[restUsers.length - 1].id}&page_size=${limit}`
  }
  res.links(links)
  res.json(restUsers)
}

async function createUser (req, res) {
  const {email, displayName, password} = req.swagger.params.body.value
  const user = await UserHandler.findFromEmail(email)
  if (user) {
    return utils.api.returnError(res, 409, 'Email address already exists.', {Location: user.restUrl})
  }
  const newUser = await UserHandler.createUserWithPassword(displayName, email, password)
  return utils.api.returnSuccess(res, newUser.toRest())
}

async function startPasswordReset (req, res) {
  const {user} = req.subjects
  const token = await user.generateResetToken()
  await utils.mail.sendEmail({
    user: {id: user.model.id, displayName: user.model.displayName},
    token: token.secret
  }, 'password-reset', user.model.emails[0], {locale: req.locale})
  return utils.api.returnSuccess(res)
}

async function passwordReset (req, res) {
  const {user} = req.subjects
  const body = req.swagger.params.body.value
  const token = body.token
  const password = body.password
  const result = await user.verifyResetPasswordToken(token)
  if (!result) {
    return utils.api.returnError(res, 400, 'Invalid token')
  }
  await user.resetPassword(password)
  return utils.api.returnSuccess(res)
}

async function startEmailVerification (req, res) {
  const {user} = req.subjects
  const email = req.swagger.params.body.value.email
  const token = await user.generateVerifyEmailToken(email)
  if (!token) {
    return utils.api.returnError(res, 400, 'Invalid email')
  }
  await utils.mail.sendEmail({
    email: email,
    emailEncoded: encodeURIComponent(email),
    token: token.secret,
    user: {id: user.model.id, displayName: user.model.displayName}
  }, 'verify-email', email, {locale: req.locale})
  return utils.api.returnSuccess(res)
}

async function verifyEmail (req, res) {
  const {user} = req.subjects
  const {email, token} = req.swagger.params.body.value
  const result = await user.verifyEmail(email, token)
  if (!result) {
    return utils.api.returnError(res, 400, 'Invalid token')
  }
  return utils.api.returnSuccess(res)
}

async function deleteUser (req, res) {
  const user = req.subjects.user
  const laundries = await user.findOwnedLaundries()
  if (laundries.length) {
    return utils.api.returnError(res, 403, 'Not allowed')
  }
  return user.deleteUser().then(() => utils.api.returnSuccess(res))
}

async function updateUser (req, res) {
  const user = req.subjects.user
  const {name} = req.swagger.params.body.value
  await user.updateName(name)
  return utils.api.returnSuccess(res)
}

async function changeUserPassword (req, res) {
  const {currentPassword, newPassword} = req.swagger.params.body.value
  const user = req.subjects.user
  let result = true
  if (user.hasPassword) {
    result = await user.verifyPassword(currentPassword)
  }
  if (!result) {
    return utils.api.returnError(res, 403, 'Invalid current password')
  }
  await user.resetPassword(newPassword)
  return utils.api.returnSuccess(res)
}

async function addOneSignalPlayerId (req, res) {
  const {user} = req.subjects
  const {playerId} = req.swagger.params.body.value
  await user.addOneSignalPlayerId(playerId)
  return utils.api.returnSuccess(res)
}

function fetchUserEmails (req, res) {
  const {user} = req.subjects
  return utils.api.returnSuccess(res, user.model.emails)
}

module.exports = {
  getUser: utils.api.wrapErrorHandler(getUser),
  listUsers: utils.api.wrapErrorHandler(listUsers),
  createUser: utils.api.wrapErrorHandler(createUser),
  startPasswordReset: utils.api.wrapErrorHandler(startPasswordReset),
  passwordReset: utils.api.wrapErrorHandler(passwordReset),
  startEmailVerification: utils.api.wrapErrorHandler(startEmailVerification),
  verifyEmail: utils.api.wrapErrorHandler(verifyEmail),
  deleteUser: utils.api.wrapErrorHandler(deleteUser),
  updateUser: utils.api.wrapErrorHandler(updateUser),
  changeUserPassword: utils.api.wrapErrorHandler(changeUserPassword),
  fetchUserEmails: utils.api.wrapErrorHandler(fetchUserEmails),
  addOneSignalPlayerId: utils.api.wrapErrorHandler(addOneSignalPlayerId)
}
