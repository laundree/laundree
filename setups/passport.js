/**
 * Created by budde on 26/04/16.
 */
var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
var LocalStrategy = require('passport-local').Strategy
var config = require('config')

var UserHandler = require('../handlers').UserHandler

passport.use(new FacebookStrategy({
  clientID: config.get('facebook.appId'),
  clientSecret: config.get('facebook.appSecret'),
  callbackURL: config.get('facebook.callbackUrl'),
  profileFields: ['id', 'first_name', 'last_name', 'middle_name', 'email', 'gender', 'displayName', 'link', 'picture']
}, (accessToken, refreshToken, profile, done) => {
  if (!profile.emails || !profile.emails.length) return done(null, null)
  UserHandler.findOrCreateFromProfile(profile).then((user) => done(null, user || null)).catch(done)
}))

passport.use(new GoogleStrategy({
  clientID: config.get('google.clientId'),
  clientSecret: config.get('google.clientSecret'),
  callbackURL: config.get('google.callbackUrl')
}, (accessToken, refreshToken, profile, done) => {
  if (!profile.emails || !profile.emails.length) return done(null, null)
  UserHandler.findOrCreateFromProfile(profile).then((user) => done(null, user || null)).catch(done)
}))

passport.use(new LocalStrategy((username, password, done) => {
  UserHandler.findFromEmail(username).then((user) => {
    if (!user) return done(null, false)
    return user.verifyPassword(password).then((result) => {
      if (!result) return done(null, false)
      done(null, user)
    })
  }).catch(done)
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
