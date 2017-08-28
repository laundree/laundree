// @flow
import passport from 'passport'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth'
import { Strategy as LocalStrategy } from 'passport-local'
import config from 'config'
import type { WebApp } from './types'
import sdk from './sdk'
import type { User } from 'laundree-sdk/lib/sdk'
import {
  INVALID_EMAIL_PASSWORD_COMBINATION,
  USER_NOT_VERIFIED
} from '../utils/flash'
import Debug from 'debug'

const debug = Debug('laundree.web.passwort')

const oauthCallback = async (accessToken, refreshToken, profile, done) => {
  if (!profile.emails || !profile.emails.length) return done(null, null)
  try {
    const user = await sdk.api.user.createUserFromProfile(profile)
    done(null, user)
  } catch (err) {
    done(err)
  }
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

passport.use(new LocalStrategy(async (username, password, done) => {
  const email = username.toLowerCase()
  try {
    const {userId, emailVerified} = await sdk.api.user.validateCredentials({email, password})
    if (!emailVerified) {
      debug('User %s is not verified', email)
      return done(null, false, {message: USER_NOT_VERIFIED})
    }
    const user = await sdk.api.user.get(userId)
    done(null, user)
  } catch (err) {
    debug('User verification failed: %s', err.message)
    done(null, false, {message: INVALID_EMAIL_PASSWORD_COMBINATION})
  }
}))

passport.serializeUser((user: User, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (userId, done) => {
  try {
    const user = await sdk.api.user.get(userId)
    done(null, user)
  } catch (err) {
    done(null, false)
  }
})

function setup (app: WebApp) {
  app.use(passport.initialize())
  app.use(passport.session())
}

export default setup
