var express = require('express')
var router = express.Router()
var passport = require('passport')
var UserHandler = require('../handlers').UserHandler

router.get('/verify', (req, res) => {
  var user = req.query.user
  var token = req.query.token
  var email = req.query.email
  if (!user || !token || !email) {
    req.flash('error', 'Invalid verification link')
    return res.redirect(req.baseUrl + '/')
  }
  UserHandler.findFromId(user).then((user) => {
    if (!user) {
      req.flash('error', 'Invalid verification link')
      return res.redirect(req.baseUrl + '/')
    }
    user.verifyEmail(email, token).then((result) => {
      if (!result) {
        req.flash('error', 'Invalid verification link')
        return res.redirect(req.baseUrl + '/')
      }
      req.flash('success', 'Your email has been verified, please login')
      return res.redirect(req.baseUrl + '/')
    })
  })
})

router.get('/facebook', function (req) {
  var params = {scope: ['public_profile', 'email']}
  if (req.query.rerequest) params.authType = 'rerequest'
  passport.authenticate('facebook', params).apply(null, arguments)
})

router.get('/facebook/callback',
  function (req) {
    passport.authenticate('facebook', {failureRedirect: req.baseUrl + '?fb_auth_failure=1'}).apply(null, arguments)
  },
  (req, res) => res.redirect('/'))

router.get('/google', passport.authenticate('google', {accessType: 'online', scope: ['openid', 'profile', 'email']}))

router.get('/google/callback',
  function (req) {
    passport.authenticate('google', {failureRedirect: req.baseUrl + '?google_auth_failure=1'}).apply(null, arguments)
  },
  (req, res) => res.redirect('/'))

router.post('/local', function (req) {
  passport.authenticate('local', {
    failureRedirect: `${req.baseUrl}`,
    successRedirect: '/',
    failureFlash: true
  }).apply(null, arguments)
})

module.exports = router
