const express = require('express')
const router = express.Router()
const locales = require('../locales')

locales.supported.forEach(locale => {
  router.get(`/${locale}`, (req, res) => {
    req.session.locale = locale
    res.redirect(req.query.r || '/')
  })
})

module.exports = router
