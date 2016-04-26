var express = require('express')
var router = express.Router()
var passport = require('passport')

router.use((req, res, next) => {
  if (!req.user) return next()
  res.redirect('/')
})

/* GET users listing. */
router.get('/', (req, res) => {
  res.render('log-in', {
    title: ['Log in'],
    no_nav: true,
    facebook_auth_failure: req.query.fb_auth_failure,
    google_auth_failure: req.query.google_auth_failure,
    styles: ['/stylesheets/log-in.css']
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

router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}))

router.get('/google/callback',
  function (req) {
    passport.authenticate('google', {failureRedirect: req.baseUrl + '?google_auth_failure=1'}).apply(null, arguments)
  },
  (req, res) => res.redirect('/'))
