const {LaundryHandler, UserHandler} = require('../../handlers')
const {api, mail} = require('../../utils')
const moment = require('moment-timezone')

/**
 * Created by budde on 02/06/16.
 */

function listLaundries (req, res) {
  const {currentUser} = req.subjects
  const filter = {}
  if (!currentUser.isAdmin) {
    filter.users = currentUser.model._id
  }
  const limit = req.swagger.params.page_size.value
  const since = req.swagger.params.since.value
  if (since) {
    filter._id = {$gt: since}
  }
  LaundryHandler.find(filter, {limit, sort: {_id: 1}})
    .then((laundries) => laundries.map((laundry) => laundry.toRestSummary()))
    .then((laundries) => {
      const links = {
        first: `/api/laundries?page_size=${limit}`
      }
      if (laundries.length === limit) {
        links.next = `/api/laundries?since=${laundries[laundries.length - 1].id}&page_size=${limit}`
      }
      res.links(links)
      res.json(laundries)
    })
    .catch(api.generateErrorHandler(res))
}

function createLaundry (req, res) {
  const name = req.swagger.params.body.value.name.trim()
  const {currentUser} = req.subjects
  if (currentUser.isDemo) return api.returnError(res, 403, 'Not allowed')
  LaundryHandler
    .find({name})
    .then(([laundry]) => {
      if (laundry) return api.returnError(res, 409, 'Laundry already exists', {Location: laundry.restUrl})
      return req.user.createLaundry(name)
        .then((laundry) => api.returnSuccess(res, laundry.toRest()))
    })
    .catch(api.generateErrorHandler(res))
}

function createDemoLaundry (req, res) {
  UserHandler
    .createDemoUser()
    .then(({user, email, password}) => LaundryHandler
      .createDemoLaundry(user)
      .then(() => api.returnSuccess(res, {email, password})))
    .catch(api.generateErrorHandler(res))
}

function sanitizeBody ({timezone, name, rules}) {
  const updateObject = {}
  if (timezone && timezone.trim()) {
    updateObject.timezone = timezone.trim()
  }
  if (name && name.trim()) {
    updateObject.name = name.trim()
  }
  if (rules) {
    updateObject.rules = rules
  }
  return updateObject
}

function timeToMinutes ({hour, minute}) {
  return hour * 60 + minute
}

function validateBody (res, laundry, body) {
  const {timezone, rules, name} = body
  if (timezone && moment.tz.names().indexOf(timezone) < 0) {
    api.returnError(res, 400, 'Invalid timezone')
    return undefined
  }
  if (rules && rules.timeLimit && timeToMinutes(rules.timeLimit.from) >= timeToMinutes(rules.timeLimit.to)) {
    api.returnError(res, 400, 'From must be before to')
    return undefined
  }
  if (!name || name === laundry.model.name) return body
  LaundryHandler
    .find({name})
    .then(([l]) => {
      if (l) {
        api.returnError(res, 409, 'Laundry already exists', {Location: l.restUrl})
        return undefined
      }
      return body
    })
  return body
}

function updateLaundry (req, res) {
  const {laundry} = req.subjects
  let body = req.swagger.params.body.value
  Promise
    .resolve(validateBody(res, laundry, sanitizeBody(body)))
    .then(result => {
      if (!result) return
      return laundry.updateLaundry(result).then(() => api.returnSuccess(res))
    })
    .catch(api.generateErrorHandler(res))
}

function fetchLaundry (req, res) {
  const laundry = req.subjects.laundry
  api.returnSuccess(res, laundry.toRest())
}

function deleteLaundry (req, res) {
  const {laundry, currentUser} = req.subjects
  if (!currentUser.isAdmin && laundry.model.demo) return api.returnError(res, 403, 'Not allowed')
  laundry.deleteLaundry()
    .then(() => api.returnSuccess(res))
    .catch(api.generateErrorHandler(res))
}

function inviteUserByEmail (req, res) {
  const email = req.swagger.params.body.value.email
  const laundry = req.subjects.laundry
  if (laundry.model.demo) return api.returnError(res, 403, 'Not allowed')
  return laundry
    .inviteUserByEmail(email)
    .then(({user, invite}) => {
      if (user) {
        return mail.sendEmail({
          email,
          laundry: laundry.model.toObject(),
          user: user.model.toObject()
        }, 'invite-user', email, {locale: req.locale})
      }
      if (invite) {
        return mail.sendEmail({
          email,
          laundry: laundry.model.toObject()
        }, 'invite', email, {locale: req.locale})
      }
    })
    .then(() => api.returnSuccess(res))
    .catch(api.generateErrorHandler(res))
}

function removeUserFromLaundry (req, res) {
  const {user, laundry} = req.subjects
  if (!laundry.isUser(user)) {
    return api.returnError(res, 403, 'Not allowed')
  }
  if (laundry.isOwner(user)) return api.returnError(res, 403, 'Not allowed')
  laundry.removeUser(user)
    .then(() => api.returnSuccess(res))
    .catch(api.generateErrorHandler(res))
}

function createInviteCode (req, res) {
  const {laundry} = req.subjects
  if (laundry.model.demo) return api.returnError(res, 403, 'Not allowed')
  laundry
    .createInviteCode()
    .then(key => api.returnSuccess(res, {
      key,
      href: `https://laundree.io/s/${laundry.shortId}/${key}`
    }))
    .catch(api.generateErrorHandler(res))
}

function addOwner (req, res) {
  const {laundry, user} = req.subjects
  if (!laundry.isUser(user) || laundry.isOwner(user)) {
    return api.returnError(res, 403, 'Not allowed')
  }
  laundry.addOwner(user)
    .then(() => api.returnSuccess(res))
    .catch(api.generateErrorHandler(res))
}

function removeOwner (req, res) {
  const {laundry, user} = req.subjects
  if (!laundry.isOwner(user)) {
    return api.returnError(res, 403, 'Not allowed')
  }
  if (!laundry.ownerIds.find(id => id !== user.model.id)) {
    return api.returnError(res, 403, 'Not allowed')
  }
  laundry.removeOwner(user)
    .then(() => api.returnSuccess(res))
    .catch(api.generateErrorHandler(res))
}

module.exports = {
  createDemoLaundry,
  inviteUserByEmail,
  listLaundries,
  updateLaundry,
  fetchLaundry,
  deleteLaundry,
  createLaundry,
  removeUserFromLaundry,
  createInviteCode,
  addOwner,
  removeOwner
}
