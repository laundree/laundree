/**
 * Created by budde on 05/05/16.
 */
const Promise = require('promise')
var path = require('path')
var YAML = require('yamljs')
var swaggerTools = require('swagger-tools')
var passport = require('passport')
const {logError} = require('../utils/error')
const {opbeat} = require('../lib/opbeat')
const {TokenHandler, LaundryHandler, MachineHandler, BookingHandler, LaundryInvitationHandler, UserHandler, EventHandler} = require('../handlers')

function generateError (message, status) {
  const error = new Error(message)
  error.statusCode = status
  return error
}

/**
 * Pull the subject Id's from the request
 * Fails if resource is not found.
 * @returns {Promise}
 */
function pullSubjects (req) {
  return Promise
    .all([
      pullSubject(req, 'userId', UserHandler),
      pullSubject(req, 'machineId', MachineHandler),
      pullSubject(req, 'tokenId', TokenHandler),
      pullSubject(req, 'inviteId', LaundryInvitationHandler),
      pullSubject(req, 'laundryId', LaundryHandler),
      pullSubject(req, 'bookingId', BookingHandler)
    ])
    .then(([user, machine, token, invite, laundry, booking]) => ({
      user, machine, token, invite, laundry, booking
    }))
    .then(subjects => Object.keys(subjects).reduce((subs, key) => {
      if (!subjects[key]) return subs
      subs[key] = subjects[key]
      return subs
    }, {}))
}

function pullSubject (req, name, _Handler) {
  if (!req.swagger.params[name]) return Promise.resolve()
  const id = req.swagger.params[name].value
  return _Handler.findFromId(id).then(instance => {
    if (!instance) throw generateError('Not found', 404)
    return instance
  })
}

function userAccess (req) {
  if (!req.user) return Promise.reject(generateError('Invalid credentials', 403))
  return pullSubjects(req).then(subjects => Object.assign({user: req.user, currentUser: req.user}, subjects))
}

/**
 * Add check to security
 * @param {IncomingMessage} req
 * @param {function (IncomingMessage) : Promise} prerequisite
 * @param {function (Object) : boolean} check
 * @param {Error} error
 * @return {Promise}
 */
function securityCheck (req, prerequisite, check, error) {
  return prerequisite(req).then(subjects => {
    if (!check(subjects)) throw error
    return subjects
  })
}

function wrapSecurity (f) {
  return (req, def, scopes, callback) => f(req).then(subjects => {
    req.subjects = subjects
    callback()
  }, callback)
}

function self (req) {
  return securityCheck(req, userAccess, subjects => subjects.currentUser.model.id === subjects.user.model.id, generateError('Not allowed', 403))
}

function tokenOwner (req) {
  return securityCheck(req, userAccess, subjects => subjects.token.isOwner(subjects.currentUser), generateError('Not found', 404))
}

function laundryUser (req) {
  return securityCheck(req, userAccess, subjects => subjects.laundry.isUser(subjects.currentUser), generateError('Not found', 404))
}

function laundryOwner (req) {
  return securityCheck(req, laundryUser, subjects => subjects.laundry.isOwner(subjects.currentUser), generateError('Not allowed', 403))
}

function bookingCreator (req) {
  return securityCheck(req, userAccess, subjects => subjects.booking.isOwner(subjects.currentUser), generateError('Not found', 404))
}

function genericOwnerCheck (subjectName) {
  return (req) => securityCheck(req, genericUserCheck(subjectName), subjects => subjects.laundry.isOwner(subjects.currentUser), generateError('Not allowed', 403))
}

function genericUserCheck (subjectName) {
  return (req) => userAccess(req).then(subjects => {
    const subject = subjects[subjectName]
    return LaundryHandler
      .findFromId(subject.model.laundry.toString())
      .then(laundry => {
        if (!laundry.isUser(subjects.currentUser)) throw generateError('Not found', 404)
        return Object.assign({laundry}, subjects)
      })
  })
}

function setup (app) {
  return new Promise((resolve) => {
    YAML.load(path.join(__dirname, '..', 'api', 'swagger', 'swagger.yaml'),
      (result) => swaggerTools.initializeMiddleware(result, (middleware) => {
        app.use(middleware.swaggerMetadata())
        app.use((req, res, next) => {
          if (!opbeat) return next()
          if (!req.swagger || !req.swagger.apiPath) return next()
          opbeat.setTransactionName(`${req.method} /api${req.swagger.apiPath}`)
          next()
        })

        app.use((req, res, next) => {
          if (req.user) return next()
          passport.authenticate('basic', (err, user, info) => {
            if (err) return next(err)
            if (!user) return next()
            req.user = user
            next()
          })(req, res, next)
        })
        app.use(EventHandler.trackingMiddleware())
        app.use(middleware.swaggerSecurity({
          subjectsExists: wrapSecurity(pullSubjects),
          userAccess: wrapSecurity(userAccess),
          self: wrapSecurity(self),
          tokenOwner: wrapSecurity(tokenOwner),
          laundryOwner: wrapSecurity(laundryOwner),
          laundryUser: wrapSecurity(laundryUser),
          machineOwner: wrapSecurity(genericOwnerCheck('machine')),
          machineUser: wrapSecurity(genericUserCheck('machine')),
          inviteOwner: wrapSecurity(genericOwnerCheck('invite')),
          bookingOwner: wrapSecurity(genericOwnerCheck('booking')),
          bookingUser: wrapSecurity(genericUserCheck('booking')),
          bookingCreator: wrapSecurity(bookingCreator)
        }))
        app.use(middleware.swaggerValidator({validateResponse: true}))
        app.use(middleware.swaggerRouter({controllers: path.join(__dirname, '..', 'api', 'controllers')}))
        app.use(middleware.swaggerUi())
        app.use('/api', (err, req, res, next) => {
          res.statusCode = res.statusCode && res.statusCode < 300 ? err.status || 500 : res.statusCode
          if (res.statusCode === 500) logError(err)
          res.json({message: err.message})
        })
        resolve(app)
      }))
  })
}
module.exports = setup
