/**
 * Created by budde on 05/05/16.
 */

var utils = require('../../utils')

var UserHandler = require('../../handlers').UserHandler

function returnError (res, statusCode, message) {
  res.statusCode = statusCode
  res.json({message: message})
}

function returnSuccess (res, statusCode, result) {
  res.statusCode = statusCode
  if (!result) return res.end()
  res.json(result)
}

function getUser (req, res) {
  var id = req.swagger.params.id.value
  UserHandler.findFromId(id).then((user) => !user ? returnError(res, 404, 'User not found.') : res.json(user.toRest()))
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
  if (!displayName) return returnError(res, 400, 'Invalid display name.')
  if (!email || !utils.regex.email.exec(email)) return returnError(res, 400, 'Invalid email address.')
  if (!password || !utils.regex.password.exec(password)) return returnError(res, 400, 'Invalid password')
  UserHandler
    .findFromEmail(email)
    .then((user) => user ? returnError(res, 400, 'Email address already exists.') : UserHandler.createUserWithPassword(displayName, email, password)
      .then((user) => res.json(user.toRest())))
    .catch(utils.api.generateErrorHandler(res))
}

function startPasswordReset (req, res) {
  var id = req.swagger.params.id.value
  if (!utils.regex.mongoDbId.exec(id)) return returnError(res, 404, 'User not found')
  UserHandler.findFromId(id)
    .then((user) => !user ? returnError(res, 404, 'User not found.') : user.generateResetToken()
      .then((token) => utils.mail.sendEmail({user: user.model, token: token}, 'password-reset', user.model.emails[0]))
      .then(() => returnSuccess(res, 204)))
    .catch(utils.api.generateErrorHandler(res))
}

function passwordReset (req, res) {
  var id = req.swagger.params.id.value
  var body = req.swagger.params.body.value
  var token = body.token
  var password = body.password
  if (!password || !utils.regex.password.exec(password)) return returnError(res, 400, 'Invalid password')
  UserHandler.findFromId(id)
    .then((user) => !user ? returnError(res, 404, 'User not found.') : user.verifyResetPasswordToken(token)
      .then((result) => !result ? returnError(res, 400, 'Invalid token') : user.resetPassword(password)
        .then(() => returnSuccess(res, 204))))
    .catch(utils.api.generateErrorHandler(res))
}

function startEmailVerification (req, res) {
  var id = req.swagger.params.id.value
  var email = req.swagger.params.body.value.email
  UserHandler.findFromId(id).then((user) => !user ? returnError(res, 404, 'User not found') : user.generateVerifyEmailToken(email)
    .then((token) => !token ? returnError(res, 400, 'Invalid email') : utils.mail.sendEmail({
      email: email,
      token: token,
      user: user.model
    }, 'verify-email', email)
      .then(() => returnSuccess(res, 204))))
    .catch(utils.api.generateErrorHandler(res))
}

function verifyEmail (req, res) {
  var id = req.swagger.params.id.value
  var body = req.swagger.params.body.value
  var email = body.email
  var token = body.token
  if (!utils.regex.email.exec(email)) return returnError(res, 400, 'Invalid email')
  UserHandler.findFromId(id)
    .then((user) => !user ? returnError(res, 404, 'User not found') : user.verifyEmail(email, token)
      .then((result) => !result ? returnError(res, 400, 'Invalid token') : returnSuccess(res, 204)))
    .catch(utils.api.generateErrorHandler(res))
}

module.exports = {
  getUser: getUser,
  listUsers: listUsers,
  createUser: createUser,
  startPasswordReset: startPasswordReset,
  passwordReset: passwordReset,
  startEmailVerification: startEmailVerification,
  verifyEmail: verifyEmail
}
