const express = require('express')
const router = express.Router()
const locales = require('../locales')
const {logError} = require('../utils/error')

locales.supported.forEach(locale => {
  router.get(`/${locale}`, (req, res) => {
    req.session.locale = locale
    if (req.user) {
      req.user.setLocale(locale).catch(logError)
    }
    res.redirect(req.query.r || '/')
  })
})

module.exports = router
