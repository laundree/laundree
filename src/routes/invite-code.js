const express = require('express')
const router = express.Router()
const base64UrlSafe = require('urlsafe-base64')
const {LaundryHandler} = require('../handlers')

const notFoundError = new Error('Not found')
notFoundError.status = 404

router.get('/:laundryId/:id', (req, res, next) => {
  const {id, laundryId} = req.params
  if (!base64UrlSafe.validate(id) || !base64UrlSafe.validate(laundryId)) {
    return next(notFoundError)
  }
  if (!req.user) return res.redirect(`/auth?to=${encodeURIComponent(req.originalUrl)}`)
  if (req.user.isDemo) {
    return next(notFoundError)
  }
  LaundryHandler
    .findFromShortId(laundryId)
    .then(laundry => {
      if (!laundry) {
        throw notFoundError
      }
      return laundry
        .verifyInviteCode(id)
        .then(result => {
          if (!result) throw new Error('Invalid key')
          return laundry.addUser(req.user)
        })
        .then(() => res.redirect(`/laundries/${laundry.model.id}`))
    })
    .catch(next)
})

module.exports = router
