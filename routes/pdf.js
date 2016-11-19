const express = require('express')
const router = express.Router()
const base64UrlSafe = require('urlsafe-base64')
const {createInvitePdf} = require('../utils/pdf')

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
