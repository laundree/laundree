/**
 * Created by budde on 05/05/16.
 */

var utils = require('../../utils')

var UserHandler = require('../../handlers').UserHandler

function linkFromRequest (req) {
  return req.protocol + '://' + req.get('host') + '/api'
}

function modelToUser (req, user) {
  return user.toRest(`${linkFromRequest(req)}/users/${user.model.id}`)
}

function returnError (res, statusCode, message) {
  res.statusCode = statusCode
  res.json({message: message})
}

function getUser (req, res) {
  var id = req.swagger.params.id.value
  UserHandler.findFromId(id).then((user) => {
    if (!user) returnError(res, 404, 'User not found.')
    res.json(modelToUser(req, user))
  }).catch(() => {
    returnError(res, 404, 'User not found.')
  })
}

function listUsers (req, res) {
  var filter = {}
  var email = req.swagger.params.email.value
  var limit = req.swagger.params.page_size.value
  if (email) {
    filter.email = email
  }
  var since = req.swagger.params.since.value
  if (since) {
    filter._id = {$gt: since}
  }
  UserHandler.find(filter, limit)
    .then((users) => users.map((user) => modelToUser(req, user)))
    .then((users) => {
      var links = {
        first: `${linkFromRequest(req)}/users?page_size=${limit}`
      }
      if (users.length === limit) {
        links.next = `${linkFromRequest(req)}/users?since=${users[users.length - 1].id}&page_size=${limit}`
      }
      res.links(links)
      res.json(users)
    })
}

function createUser (req, res) {
  var body = req.swagger.params.body.value
  var displayName = body.displayName
  var email = body.email
  var password = body.password
  if (!displayName) return returnError(res, 400, 'Invalid display name.')
  if (!email || !utils.regex.email.exec(email)) return returnError(res, 400, 'Invalid email address.')
  if (!password || !utils.regex.password.exec(password)) returnError(res, 400, 'Invalid password')
  UserHandler.findFromEmail(email).then((user) => {
    if (user) return returnError(res, 400, 'Email address already exists.')
    UserHandler.createUserWithPassword(displayName, email, password)
      .then((user) => res.json(modelToUser(req, user)))
  })
}

module.exports = {
  getUser: getUser,
  listUsers: listUsers,
  createUser: createUser
}
