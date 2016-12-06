const express = require('express')
const router = express.Router()
const base64UrlSafe = require('urlsafe-base64')
const {createInvitePdf} = require('../utils/pdf')
const {LaundryHandler} = require('../handlers')
const debug = require('debug')('laundree.routes.pdf')

router.get('/invite/:laundryId', (req, res, next) => {
  debug('Starting to create invite')
  const {laundryId} = req.params
  if (!req.user) {
    debug('User not found, aborting')
    return next()
  }
  LaundryHandler
    .findFromId(laundryId)
    .then(laundry => {
      if (!laundry) {
        debug('Laundry is not found, aborting')
        return next()
      }
      if (!laundry.isOwner(req.user)) {
        debug('User is not owner, aborting')
        return next()
      }
      return laundry
        .createInviteCode()
        .then(code => {
          debug('Got code, redirecting')
          res.redirect(`${req.baseUrl}/invite/${laundry.shortId}/${code}`)
        })
    })
    .catch(next)
})

router.get('/invite/:laundryId/:id', (req, res, next) => {
  const {id, laundryId} = req.params
  if (!base64UrlSafe.validate(id) || !base64UrlSafe.validate(laundryId)) {
    const error = new Error('Not found')
    error.status = 404
    return next(error)
  }

  res.set('Content-Type', 'application/pdf')
  createInvitePdf(laundryId, id).pipe(res)
})

module.exports = router
