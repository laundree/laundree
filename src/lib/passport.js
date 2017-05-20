/**
 * Created by budde on 26/04/16.
 */
import passport from 'passport'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth'
import { Strategy as LocalStrategy } from 'passport-local'
import { BasicStrategy } from 'passport-http'
import UserHandler from '../handlers/user'
import config from 'config'
import {
  INVALID_EMAIL_PASSWORD_COMBINATION,
  USER_NOT_VERIFIED,
  USER_DOES_NOT_EXISTS,
  USER_NOT_FOUND
} from '../utils/flash'

const oauthCallback = (accessToken, refreshToken, profile, done) => {
  if (!profile.emails || !profile.emails.length) return done(null, null)
  UserHandler.findOrCreateFromProfile(profile)
    .then((user) => {
      if (user) user.seen()
      done(null, user || null, {message: USER_NOT_FOUND})
    }).catch(done)
}
passport.use(new FacebookStrategy({
  clientID: config.get('facebook.appId'),
  clientSecret: config.get('facebook.appSecret'),
  callbackURL: config.get('facebook.callbackUrl'),
  profileFields: ['id', 'first_name', 'last_name', 'middle_name', 'email', 'gender', 'displayName', 'link', 'picture.type(large)']
}, oauthCallback))

passport.use(new GoogleStrategy({
  clientID: config.get('google.clientId'),
  clientSecret: config.get('google.clientSecret'),
  callbackURL: config.get('google.callbackUrl')
}, oauthCallback))

passport.use(new BasicStrategy(async (userId, password, done) => {
  const {user, token} = await UserHandler.lib.findFromIdWithTokenSecret(userId, password)
  if (!token) return done(null, false)
  token.seen()
  done(null, user)
}))

passport.use(new LocalStrategy((username, password, done) => {
  username = username.toLowerCase()
  UserHandler.findFromEmail(username).then(user => {
    if (!user) return done(null, false, {message: USER_DOES_NOT_EXISTS})
    if (!user.isVerified(username)) return done(null, false, {message: USER_NOT_VERIFIED})
    return user.verifyPassword(password).then((result) => {
      if (!result) return done(null, false, {message: INVALID_EMAIL_PASSWORD_COMBINATION})
      user.seen()
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

function markLoggedIn (req, res, next) {
  if (!req.user) return next()
  req.session.returningUser = true
  next()
}

function setup (app) {
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(markLoggedIn)
}

module.exports = setup
