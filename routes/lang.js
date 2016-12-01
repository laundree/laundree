const express = require('express')
const router = express.Router()
const locales = require('../locales')

Object.keys(locales).forEach(locale => {
  router.get(`/${locale}`, (req, res) => {
    req.session.locale = locale
    res.redirect(req.query.r || '/')
  })
})

module.exports = router
