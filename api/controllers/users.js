/**
 * Created by budde on 05/05/16.
 */

var utils = require('../../utils')

var UserHandler = require('../../handlers').UserHandler

function getUser (req, res) {
  var id = req.swagger.params.id.value
  UserHandler.findFromId(id)
    .then((user) => !user
      ? utils.api.returnError(res, 404, 'User not found.')
      : utils.api.returnSuccess(res, user.toRest()))
    .catch(utils.api.generateErrorHandler(res))
}

function listUsers (req, res) {
  var filter = {}
  var email = req.swagger.params.email.value
  var limit = req.swagger.params.page_size.value
  if (email) {
    filter['profiles.emails.value'] = email
  }
  var since = req.swagger.params.since.value
  if (since) {
    filter._id = {$gt: since}
  }
  UserHandler.find(filter, limit)
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
  var body = req.swagger.params.body.value
  var displayName = body.displayName
  var email = body.email
  var password = body.password
  UserHandler
    .findFromEmail(email)
    .then((user) => user
      ? utils.api.returnError(res, 409, 'Email address already exists.', {Location: user.restUrl})
      : UserHandler.createUserWithPassword(displayName, email, password)
      .then((user) => utils.api.returnSuccess(res, user.toRest())))
    .catch(utils.api.generateErrorHandler(res))
}

function startPasswordReset (req, res) {
  var id = req.swagger.params.id.value
  UserHandler.findFromId(id)
    .then((user) => !user ? utils.api.returnError(res, 404, 'User not found.') : user.generateResetToken()
      .then((token) => utils.mail.sendEmail({user: user.model, token: token}, 'password-reset', user.model.emails[0]))
      .then(() => utils.api.returnSuccess(res)))
    .catch(utils.api.generateErrorHandler(res))
}

function passwordReset (req, res) {
  var id = req.swagger.params.id.value
  var body = req.swagger.params.body.value
  var token = body.token
  var password = body.password
  UserHandler.findFromId(id)
    .then((user) => !user ? utils.api.returnError(res, 404, 'User not found.') : user.verifyResetPasswordToken(token)
      .then((result) => !result ? utils.api.returnError(res, 400, 'Invalid token') : user.resetPassword(password)
        .then(() => utils.api.returnSuccess(res))))
    .catch(utils.api.generateErrorHandler(res))
}

function startEmailVerification (req, res) {
  var id = req.swagger.params.id.value
  var email = req.swagger.params.body.value.email
  UserHandler.findFromId(id).then((user) => !user ? utils.api.returnError(res, 404, 'User not found') : user.generateVerifyEmailToken(email)
    .then((token) => !token ? utils.api.returnError(res, 400, 'Invalid email') : utils.mail.sendEmail({
      email: email,
      emailEncoded: encodeURIComponent(email),
      token: token,
      user: user.model
    }, 'verify-email', email)
      .then(() => utils.api.returnSuccess(res))))
    .catch(utils.api.generateErrorHandler(res))
}

function verifyEmail (req, res) {
  var id = req.swagger.params.id.value
  var body = req.swagger.params.body.value
  var email = body.email
  var token = body.token
  UserHandler.findFromId(id)
    .then((user) => !user ? utils.api.returnError(res, 404, 'User not found') : user.verifyEmail(email, token)
      .then((result) => !result ? utils.api.returnError(res, 400, 'Invalid token') : utils.api.returnSuccess(res)))
    .catch(utils.api.generateErrorHandler(res))
}

function deleteUser (req, res) {
  const id = req.swagger.params.id.value
  UserHandler.findFromId(id)
    .then((user) => {
      if (!user) return utils.api.returnError(res, 404, 'User not found')
      if (user.model.id !== req.user.model.id) return utils.api.returnError(res, 403, 'Not allowed')
      return user.findOwnedLaundries().then((laundries) => {
        if (laundries.length) return utils.api.returnError(res, 403, 'Not allowed')
        return user.deleteUser().then(() => utils.api.returnSuccess(res))
      })
    })
    .catch(utils.api.generateErrorHandler(res))
}

module.exports = {
  getUser: getUser,
  listUsers: listUsers,
  createUser: createUser,
  startPasswordReset: startPasswordReset,
  passwordReset: passwordReset,
  startEmailVerification: startEmailVerification,
  verifyEmail: verifyEmail,
  deleteUser: deleteUser
}
