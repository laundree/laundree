/**
 * Created by budde on 05/05/16.
 */
const Promise = require('promise')
var path = require('path')
var YAML = require('yamljs')
var swaggerTools = require('swagger-tools')
var config = require('config')
var passport = require('passport')
const {logError} = require('../utils/error')
const {opbeat} = require('../lib/opbeat')
const {TokenHandler, LaundryHandler, MachineHandler, BookingHandler, LaundryInvitationHandler} = require('../handlers')

function generateError (message, status) {
  const error = new Error(message)
  error.statusCode = status
  return error
}

function checkLaundryUser (id, user) {
  return LaundryHandler
    .findFromId(id)
    .then(laundry => {
      if (!laundry) throw generateError('Not found', 404)
      if (!laundry.isUser(user)) throw generateError('Not found', 404)
      return laundry
    })
}

function checkLaundryOwner (id, user) {
  return checkLaundryUser(id, user)
    .then(laundry => {
      if (!laundry.isOwner(user)) throw generateError('Not allowed')
      return laundry
    })
}

function generateChecker (_Handler, index, f) {
  return (req, def, scopes, callback) => {
    if (!req.user) return callback(generateError('Invalid credentials', 403))
    _Handler
      .findFromId(req.swagger.params.id.value)
      .then(obj => {
        if (!obj) throw generateError('Not found', 404)
        return f(obj.model.laundry.toString(), req.user)
          .then(laundry => {
            req.subjects = {laundry}
            req.subjects[index] = obj
            callback()
          })
      })
      .catch(callback)
  }
}

function generateUserChecker (_Handler, index) {
  return generateChecker(_Handler, index, checkLaundryUser)
}

function generateOwnerChecker (_Handler, index) {
  return generateChecker(_Handler, index, checkLaundryOwner)
}

function setup (app) {
  return new Promise((resolve, reject) => {
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

        app.use(middleware.swaggerSecurity({
          userAccess: (req, def, scopes, callback) => {
            if (!req.user) return callback(generateError('Invalid credentials', 403))
            req.subjects = {user: req.user}
            callback()
          },
          self: (req, def, scopes, callback) => {
            if (!req.user) return callback(generateError('Invalid credentials', 403))
            if (req.swagger.params.id.value !== req.user.model.id) return callback(generateError('Not allowed', 403))
            req.subjects = {user: req.user}
            callback()
          },
          tokenOwner: (req, def, scopes, callback) => {
            if (!req.user) return callback(generateError('Invalid credentials', 403))
            TokenHandler
              .findFromId(req.swagger.params.id.value)
              .then((token) => {
                if (!token) throw generateError('Token not found', 404)
                if (!token.isOwner(req.user)) return callback(generateError('Token not found', 404))
                req.subjects = {token}
                callback()
              })
              .catch(callback)
          },
          laundryOwner: (req, def, scopes, callback) => {
            if (!req.user) return callback(generateError('Invalid credentials', 403))
            checkLaundryOwner(req.swagger.params.id.value, req.user)
              .then(laundry => {
                req.subjects = {laundry}
                callback()
              })
              .catch(callback)
          },
          laundryUser: (req, def, scopes, callback) => {
            if (!req.user) return callback(generateError('Invalid credentials', 403))
            checkLaundryUser(req.swagger.params.id.value, req.user)
              .then(laundry => {
                req.subjects = {laundry}
                callback()
              })
              .catch(callback)
          },
          machineOwner: generateOwnerChecker(MachineHandler, 'machine'),
          machineUser: generateUserChecker(MachineHandler, 'machine'),
          inviteOwner: generateOwnerChecker(LaundryInvitationHandler, 'invite'),
          bookingOwner: generateOwnerChecker(BookingHandler, 'booking'),
          bookingUser: generateUserChecker(BookingHandler, 'booking'),
          bookingCreator: (req, def, scopes, callback) => {
            if (!req.user) return callback(generateError('Invalid credentials', 403))
            BookingHandler
              .findFromId(req.swagger.params.id.value)
              .then(booking => {
                if (!booking) throw generateError('Not found', 404)
                if (!booking.isOwner(req.user)) throw generateError('Not found', 404)
                req.subjects = {booking}
                callback()
              })
              .catch(callback)
          }
        }))
        app.use(middleware.swaggerValidator({validateResponse: true}))
        app.use(middleware.swaggerRouter({controllers: path.join(__dirname, '..', 'api', 'controllers')}))
        app.use(middleware.swaggerUi())
        app.use('/api', (err, req, res, next) => {
          res.statusCode = res.statusCode && res.statusCode < 300 ? err.status || 500 : res.statusCode
          if (config.get('logging.error.enabled') && res.statusCode === 500) logError(err)
          res.json({message: err.message})
        })
        resolve(app)
      }))
  })
}
module.exports = setup
