/**
 * Created by budde on 26/04/16.
 */
var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
var config = require('../config')

var UserHandler = require('../handlers').UserHandler

passport.use(new FacebookStrategy({
  clientID: config.facebook.appId,
  clientSecret: config.facebook.appSecret,
  callbackURL: config.facebook.callbackUrl,
  profileFields: ['id', 'first_name', 'last_name', 'middle_name', 'email', 'gender', 'displayName', 'link', 'picture']
}, (accessToken, refreshToken, profile, done) => {
  if (!profile.emails || !profile.emails.length) return done(null, null)
  UserHandler.findOrCreateFromProfile(profile).then((user) => done(null, user || null)).catch(done)
}))

passport.use(new GoogleStrategy({
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackUrl
}, (accessToken, refreshToken, profile, done) => {
  if (!profile.emails || !profile.emails.length) return done(null, null)
  UserHandler.findOrCreateFromProfile(profile).then((user) => done(null, user || null)).catch(done)
}))

passport.serializeUser((user, done) => {
  done(null, user.model.id)
})

passport.deserializeUser((user, done) => {
  UserHandler.findFromId(user).then((user) => done(null, user || false)).catch(done)
})

function setup (app) {
  app.use(passport.initialize())
  app.use(passport.session())
}

module.exports = setup
