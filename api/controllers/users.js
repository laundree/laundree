/**
 * Created by budde on 05/05/16.
 */

var utils = require('../../utils')

var UserHandler = require('../../handlers').UserHandler

function getUser (req, res) {
  const {user} = req.subjects
  utils.api.returnSuccess(res, user.toRest())
}

function listUsers (req, res) {
  var filter = {}
  var email = req.swagger.params.email.value
  var limit = req.swagger.params.page_size.value
  if (email) {
    filter['profiles.emails.value'] = email.toLowerCase()
  }
  var since = req.swagger.params.since.value
  if (since) {
    filter._id = {$gt: since}
  }
  UserHandler.find(filter, {limit, sort: {_id: 1}})
    .then((users) => users.map((user) => user.toRestSummary()))
    .then((users) => {
      var links = {
        first: `/api/users?page_size=${limit}`
      }
      if (users.length === limit) {
        links.next = `/api/users?since=${users[users.length - 1].id}&page_size=${limit}`
      }
      res.links(links)
      res.json(users)
    })
    .catch(utils.api.generateErrorHandler(res))
}

function createUser (req, res) {
  const {email, displayName, password} = req.swagger.params.body.value
  UserHandler
    .findFromEmail(email)
    .then((user) => user
      ? utils.api.returnError(res, 409, 'Email address already exists.', {Location: user.restUrl})
      : UserHandler.createUserWithPassword(displayName, email, password)
      .then((user) => utils.api.returnSuccess(res, user.toRest())))
    .catch(utils.api.generateErrorHandler(res))
}

function startPasswordReset (req, res) {
  const {user} = req.subjects
  user.generateResetToken()
    .then((token) => utils.mail.sendEmail({
      user: {id: user.model.id},
      token: token
    }, 'password-reset', user.model.emails[0]))
    .then(() => utils.api.returnSuccess(res))
    .catch(utils.api.generateErrorHandler(res))
}

function passwordReset (req, res) {
  const {user} = req.subjects
  const body = req.swagger.params.body.value
  const token = body.token
  const password = body.password
  user.verifyResetPasswordToken(token)
    .then((result) => !result ? utils.api.returnError(res, 400, 'Invalid token') : user.resetPassword(password)
      .then(() => utils.api.returnSuccess(res)))
    .catch(utils.api.generateErrorHandler(res))
}

function startEmailVerification (req, res) {
  const {user} = req.subjects
  var email = req.swagger.params.body.value.email
  user.generateVerifyEmailToken(email)
    .then((token) => !token ? utils.api.returnError(res, 400, 'Invalid email') : utils.mail.sendEmail({
      email: email,
      emailEncoded: encodeURIComponent(email),
      token: token,
      user: {id: user.model.id}
    }, 'verify-email', email)
      .then(() => utils.api.returnSuccess(res)))
    .catch(utils.api.generateErrorHandler(res))
}

function verifyEmail (req, res) {
  const {user} = req.subjects
  const {email, token} = req.swagger.params.body.value
  user.verifyEmail(email, token)
    .then((result) => !result ? utils.api.returnError(res, 400, 'Invalid token') : utils.api.returnSuccess(res))
    .catch(utils.api.generateErrorHandler(res))
}

function deleteUser (req, res) {
  const user = req.subjects.user
  user.findOwnedLaundries()
    .then((laundries) => {
      if (laundries.length) return utils.api.returnError(res, 403, 'Not allowed')
      return user.deleteUser().then(() => utils.api.returnSuccess(res))
    })
    .catch(utils.api.generateErrorHandler(res))
}

function updateUser (req, res) {
  const user = req.subjects.user
  const {name} = req.swagger.params.body.value
  user.updateName(name)
    .then(() => utils.api.returnSuccess(res))
    .catch(utils.api.generateErrorHandler(res))
}

function changeUserPassword (req, res) {
  const {currentPassword, newPassword} = req.swagger.params.body.value
  const user = req.subjects.user
  const promise = user.hasPassword
    ? user.verifyPassword(currentPassword)
    : Promise.resolve(true)
  promise
    .then(result => {
      if (!result) return utils.api.returnError(res, 403, 'Invalid current password')
      return user
        .resetPassword(newPassword)
        .then(() => utils.api.returnSuccess(res))
    })
    .catch(utils.api.generateErrorHandler(res))
}

function fetchUserEmails (req, res) {
  const {user} = req.subjects
  return utils.api.returnSuccess(res, user.model.emails)
}
module.exports = {
  getUser,
  listUsers,
  createUser,
  startPasswordReset,
  passwordReset,
  startEmailVerification,
  verifyEmail,
  deleteUser,
  updateUser,
  changeUserPassword,
  fetchUserEmails
}
