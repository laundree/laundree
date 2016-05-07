var express = require('express')
var router = express.Router()
var passport = require('passport')
/* GET users listing. */
router.get('/', (req, res) => res.render('log-in', {
  title: ['Log in'],
  no_nav: true,
  facebook_auth_failure: req.query.fb_auth_failure,
  google_auth_failure: req.query.google_auth_failure,
  styles: ['/stylesheets/auth.css']
}))

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
    failureRedirect: `${req.baseUrl}?local_auth_failure=1`,
    successRedirect: '/'
  }).apply(null, arguments)
})

router.get('/sign-up', (req, res) => res.render('sign-up', {
  title: ['Sign up for an account '],
  no_nav: true,
  styles: ['/stylesheets/auth.css']
}))
