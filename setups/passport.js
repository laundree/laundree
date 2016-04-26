/**
 * Created by budde on 26/04/16.
 */
var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
var config = require('../config')

passport.use(new FacebookStrategy({
  clientID: config.facebook.appId,
  clientSecret: config.facebook.appSecret,
  callbackURL: config.facebook.callbackUrl,
  profileFields: ['id', 'first_name', 'last_name', 'middle_name', 'email', 'gender', 'displayName', 'link', 'picture']
}, (accessToken, refreshToken, profile, done) => {
  if (!profile.emails || !profile.emails.length) return done(null, null)
  done(null, profile)
}))

passport.use(new GoogleStrategy({
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackUrl
}, (accessToken, refreshToken, profile, done) => {
  if (!profile.emails || !profile.emails.length) return done(null, null)
  done(null, profile)
}))

var users = {}

passport.serializeUser((user, done) => {
  users[user.id] = user
  done(null, user.id)
})

passport.deserializeUser((user, done) => {
  done(null, users[user])
})

function setup (app) {
  app.use(passport.initialize())
  app.use(passport.session())
}

module.exports = setup
