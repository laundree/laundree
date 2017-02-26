const express = require('express')
const router = express.Router()
const passport = require('passport')
const UserHandler = require('../handlers').UserHandler
const debug = require('debug')('laundree.routes.auth')
router.get('/verify', (req, res) => {
  const user = req.query.user
  const token = req.query.token
  const email = req.query.email
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
function findRedirect (req) {
  const {mode, to} = req.query
  switch (mode) {
    case 'native-app':
      return {to: `/native-app`, errorTo: `/native-app`}
    default:
      return {to: to ? decodeURIComponent(to) : '/'}
  }
}

function saveTo (f) {
  return function (req) {
    const {to, errorTo} = findRedirect(req)
    debug('Saving to: ', to)
    req.session.to = to
    req.session.errorTo = errorTo
    return f.apply(null, arguments)
  }
}

function setupCallback (router, strategy) {
  router.get(`/${strategy}/callback`,
    function (req) {
      debug('Got state', req.query.state)
      passport.authenticate(strategy, {failureRedirect: req.session.errorTo || `${req.baseUrl}?${strategy}_auth_failure=1`}).apply(null, arguments)
    },
    (req, res) => res.redirect(req.session.to))
}

router.get('/facebook', saveTo(function (req) {
  const params = {scope: ['public_profile', 'email'], state: 'test'}
  if (req.query.rerequest) params.authType = 'rerequest'
  passport.authenticate('facebook', params).apply(null, arguments)
}))

setupCallback(router, 'facebook')

router.get('/google', saveTo(passport.authenticate('google', {
  accessType: 'online',
  scope: ['openid', 'profile', 'email'],
  state: 'test'
})))

setupCallback(router, 'google')

router.post('/local', function (req) {
  passport.authenticate('local', {
    failureRedirect: `${req.baseUrl}`,
    successRedirect: findRedirect(req).to,
    failureFlash: true
  }).apply(null, arguments)
})

module.exports = router
