// @flow

import path from 'path'
import YAML from 'yamljs'
import swaggerTools from 'swagger-tools'
import passport from 'passport'
import { logError, StatusError } from '../utils/error'
import { opbeat } from '../lib/opbeat'
import TokenHandler from '../handlers/token'
import LaundryHandler from '../handlers/laundry'
import MachineHandler from '../handlers/machine'
import BookingHandler from '../handlers/booking'
import LaundryInvitationHandler from '../handlers/laundry_invitation'
import UserHandler from '../handlers/user'
import express from 'express'
import type {Request} from '../types'

const router = express.Router()

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
    .then(([user, machine, token, invite, laundry, booking]) => {
      const subjects = {user, machine, token, invite, laundry, booking}
      if (laundry) return subjects
      const subject = machine || invite || booking
      if (!subject) return subjects
      return LaundryHandler
        .lib
        .findFromId(subject.model.laundry.toString())
        .then(laundry => Object.assign(subjects, {laundry}))
    })
    .then(subjects => Object.keys(subjects).reduce((subs, key) => {
      if (!subjects[key]) return subs
      subs[key] = subjects[key]
      return subs
    }, {}))
}

function pullSubject (req, name, _Handler) {
  if (!req.swagger.params[name]) return Promise.resolve()
  const id = req.swagger.params[name].value
  return _Handler.lib.findFromId(id).then(instance => {
    if (!instance) throw new StatusError('Not found', 404)
    return instance
  })
}

function userAccess (req) {
  if (!req.user) return Promise.reject(new StatusError('Invalid credentials', 403))
  return pullSubjects(req).then(subjects => ({...{user: req.user, currentUser: req.user}, ...subjects}))
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
    if (!check(subjects)) {
      throw error
    }
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
  return securityCheck(req, userAccess, subjects => subjects.currentUser.model.id === subjects.user.model.id, new StatusError('Not allowed', 403))
}

function administrator (req) {
  return securityCheck(req, userAccess, subjects => subjects.currentUser.isAdmin(), new StatusError('Not allowed', 403))
}

function tokenOwner (req) {
  return securityCheck(req, userAccess, subjects => subjects.token.isOwner(subjects.currentUser), new StatusError('Not found', 404))
}

function laundryUser (req) {
  return securityCheck(req, userAccess, subjects => subjects.laundry.isUser(subjects.currentUser), new StatusError('Not found', 404))
}

function laundryOwner (req) {
  return securityCheck(req, laundryUser, subjects => subjects.laundry.isOwner(subjects.currentUser), new StatusError('Not allowed', 403))
}

function bookingCreator (req) {
  return securityCheck(req, userAccess, subjects => subjects.booking.isOwner(subjects.currentUser), new StatusError('Not found', 404))
}

export function fetchRouter () {
  return new Promise((resolve) => {
    YAML.load(path.join(__dirname, '..', 'api', 'swagger', 'swagger.yaml'),
      (result) => swaggerTools.initializeMiddleware(result, (middleware) => {
        router.use(middleware.swaggerMetadata())
        router.use((req: Request, res, next) => {
          if (!opbeat) return next()
          if (!req.swagger || !req.swagger.apiPath) return next()
          opbeat.setTransactionName(`${req.method} ${req.swagger.apiPath}`)
          next()
        })

        router.use((req: Request, res, next) => {
          passport.authenticate('basic', (err, user, info) => {
            if (err) return next(err)
            if (!user) return next()
            req.user = user
            next()
          })(req, res, next)
        })
        router.use(middleware.swaggerSecurity({
          subjectsExists: wrapSecurity(pullSubjects),
          userAccess: wrapSecurity(userAccess),
          self: wrapSecurity(self),
          administrator: wrapSecurity(administrator),
          tokenOwner: wrapSecurity(tokenOwner),
          laundryOwner: wrapSecurity(laundryOwner),
          laundryUser: wrapSecurity(laundryUser),
          bookingCreator: wrapSecurity(bookingCreator)
        }))
        router.use(middleware.swaggerValidator({validateResponse: true}))
        router.use(middleware.swaggerRouter({controllers: path.join(__dirname, '..', 'api', 'controllers')}))
        router.use((err, req: Request, res, next) => {
          const status = (typeof err.status === 'number' && err.status) || 500
          res.status(status)
          if (res.statusCode === 500) logError(err)
          res.json({message: err.message})
        })
        resolve(router)
      }))
  })
}
