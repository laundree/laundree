var express = require('express')
var router = express.Router()
var passport = require('passport')
var UserHandler = require('../handlers').UserHandler

/* GET users listing. */
router.get('/', (req, res) => {
  if (req.query.fb_auth_failure) req.flash('error', 'Facebook auth failed.')
  if (req.query.google_auth_failure) req.flash('error', 'Google auth failed.')
  res.render('log-in', {
    title: ['Log in'],
    no_nav: true,
    errorMessages: req.flash('error'),
    successMessages: req.flash('success'),
    styles: ['/stylesheets/auth.css']
  })
})

router.get('/forgot', (req, res) => res.render('forgot-password', {
  title: ['Forgot password'],
  no_nav: true,
  styles: ['/stylesheets/auth.css']
}))

router.get('/reset', (req, res) => {
  var user = req.query.user
  var token = req.query.token
  if (!user || !token) return res.redirect(req.baseUrl + '/forgot')
  res.render('reset-password', {
    title: ['Reset password'],
    no_nav: true,
    user_id: user,
    token: token,
    styles: ['/stylesheets/auth.css']
  })
})

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

module.exports = router

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

router.get('/sign-up', (req, res) => res.render('sign-up', {
  title: ['Sign up for an account '],
  no_nav: true,
  styles: ['/stylesheets/auth.css']
}))
