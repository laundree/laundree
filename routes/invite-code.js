const express = require('express')
const router = express.Router()
const base64UrlSafe = require('urlsafe-base64')
const {LaundryHandler} = require('../handlers')

router.get('/:laundryId/:id', (req, res, next) => {
  const {id, laundryId} = req.params
  if (!base64UrlSafe.validate(id) || !base64UrlSafe.validate(laundryId)) {
    const error = new Error('Not found')
    error.status = 404
    return next(error)
  }
  if (!req.user) return res.redirect(`/auth?to=${encodeURIComponent(req.originalUrl)}`)
  LaundryHandler
    .findFromShortId(laundryId)
    .then(laundry => {
      if (!laundry) {
        const error = new Error('Not found')
        error.status = 404
        throw error
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
