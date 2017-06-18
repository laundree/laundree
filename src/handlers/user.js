// @flow

import { Handler, HandlerLibrary } from './handler'
import TokenHandler from './token'
import BookingHandler from './booking'
import LaundryInvitationHandler from './laundry_invitation'
import UserModel from '../models/user'
import type { Profile, UserRole } from '../models/user'
import * as str from '../utils/string'
import * as error from '../utils/error'
import * as pwd from '../utils/password'
import uuid from 'uuid'
import config from 'config'
import Debug from 'debug'
import LaundryHandler from './laundry'
import type {User} from 'laundree-sdk/lib/redux'

const debug = Debug('laundree.handlers.user')

class UserHandlerLibrary extends HandlerLibrary {

  constructor () {
    super(UserHandler, UserModel, {
      update: (obj) => typeof obj === 'string' ? null : {type: 'UPDATE_USER', payload: obj.reduxModel()}
    })
  }

  /**
   * Find a user from given email address.
   * @param {string} email
   * @return {Promise.<UserHandler>}
   */
  async findFromEmail (email: string): Promise<?UserHandler> {
    const [user] = await this.find({'profiles.emails.value': email.toLowerCase().trim()})
    return user
  }

  /**
   * Find or create a user from profile.
   * @param {Profile} profile
   * @return {Promise.<UserHandler>}
   */
  async findOrCreateFromProfile (profile: Profile) {
    if (!profile.emails || !profile.emails.length) {
      return null
    }
    const user = await this.findFromEmail(profile.emails[0].value)
    return user
      ? user.updateProfile(profile)
      : this.createUserFromProfile(profile)
  }

  /**
   *
   * @param {string} userId
   * @param {string} secret
   * @returns {Promise.<{user: UserHandler=, token: TokenHandler=}>}
   */
  async findFromIdWithTokenSecret (userId: string, secret: string): {} | { user: UserHandler, token: TokenHandler } {
    const user = await this.findFromId(userId)
    if (!user) {
      return {}
    }
    const token = await user.findAuthTokenFromSecret(secret)
    if (!token) {
      return {}
    }
    return {user, token}
  }

  /**
   * Finds a user from verified email and valid password
   * @param email
   * @param password
   * @returns {Promise.<UserHandler>}
   */
  async findFromVerifiedEmailAndVerifyPassword (email: string, password: string) {
    const user = await this.findFromEmail(email)
    if (!user) {
      return null
    }
    if (!user.isVerified(email)) {
      return null
    }
    const result = await user.verifyPassword(password)
    return result
      ? user
      : null
  }

  /**
   * Create a new user from given profile.
   * @param {Profile} profile
   * @return {Promise.<UserHandler>}
   */
  async createUserFromProfile (profile: Profile) {
    if (!profile.emails || !profile.emails.length) {
      return null
    }
    const role = profile.emails.reduce((role, {value}) => role || config.get('defaultUsers')[value], null) || 'user'
    const model = await new UserModel({
      docVersion: 1,
      profiles: [Object.assign({}, profile, {emails: profile.emails.map(({value}) => ({value: value.toLowerCase()}))})],
      latestProvider: profile.provider,
      role
    }).save()
    const handler = new UserHandler(model)
    this.emitEvent('create', handler)
    await handler.addLaundriesFromInvites()
    return handler
  }

  /**
   * @param {String} displayName
   * @param {String} email
   * @param {String} password
   * @returns {Promise.<UserHandler>}
   */
  async createUserWithPassword (displayName: string, email: string, password: string) {
    displayName = displayName.split(' ').filter((name) => name.length).join(' ')

    const profile = {
      id: email,
      displayName: displayName,
      name: displayNameToName(displayName),
      provider: 'local',
      emails: [{value: email}],
      photos: [{value: `/identicon/${str.hash(email)}/150.svg`}]
    }
    const [user, passwordHash] = await Promise.all([
      this.createUserFromProfile(profile),
      pwd.hashPassword(password)])
    if (!user) {
      return null
    }
    user.model.password = passwordHash
    await user.model.save()
    return user
  }

  /**
   * Create a demo user
   * @returns {Promise.<{email: string, user: UserHandler, password: string}>}
   */
  async createDemoUser () {
    const displayName = 'Demo user'
    const email = `demo-user-${uuid.v4()}@laundree.io`
    const profile = {
      id: email,
      displayName,
      name: displayNameToName(displayName),
      provider: 'local',
      emails: [{value: email}],
      photos: [{value: `/identicon/${str.hash(email)}/150.svg`}]
    }
    const [user, {token, hash}] = await Promise
      .all([
        this.createUserFromProfile(profile),
        pwd.generateTokenAndHash()
      ])
    if (!user) {
      return null
    }
    user.model.oneTimePassword = hash
    user.model.demo = true
    user.model.explicitVerifiedEmails.push(email)
    await user.model.save()
    return {password: token, user, email}
  }
}
/**
 * @param {string}displayName
 * @return {{givenName: string=, middleName: string=, lastName: string=}}
 */
function displayNameToName (displayName) {
  const names = displayName.split(' ').filter(name => name.length)
  const noNames = names.length
  if (noNames === 0) return {}
  if (noNames === 1) return {givenName: names[0]}
  if (noNames === 2) return {givenName: names[0], familyName: names[1]}
  return {
    givenName: names[0],
    middleName: names.slice(1, names.length - 1).join(' '),
    familyName: names[names.length - 1]
  }
}

/**
 * @typedef {{provider: string, id: string, displayName: string, name: {familyName: string=, middleName: string=, givenName: string=}, emails: {value: string, type: string=}[], photos: {value: string}[]=}} Profile
 */

export default class UserHandler extends Handler<UserModel, User> {
  static lib = new UserHandlerLibrary()
  lib = UserHandler.lib

  updateActions = [
    (user: UserHandler) => {
      user.model.calendarTokensReferences = []
      user.model.docVersion = 1
      return user.model.save().then(() => new UserHandler(user.model))
    }
  ]

  /**
   * Will eventually add profile if a profile with the same provider isn't present, or
   * replace the existing profile if it is.
   *
   * @param {Profile} profile
   * @return {Promise.<UserHandler>}
   */
  updateProfile (profile: Profile): Promise<UserHandler> {
    this.model.profiles = this.model.profiles.filter((p) => p.provider !== profile.provider)
    this.model.profiles.push(profile)
    this.model.latestProvider = profile.provider
    return this.save()
  }

  /**
   * Add one-signal player id
   * @param playId
   * @returns {Promise.<number>}
   */
  async addOneSignalPlayerId (playId: string) {
    if (this.model.oneSignalPlayerIds.includes(playId)) {
      return 0
    }
    this.model.oneSignalPlayerIds.push(playId)
    await this.save()
    this._updateBookings().catch(error.logError)
    return 1
  }

  async _updateBookings () {
    debug('Updating bookigns with playId', this.model.oneSignalPlayerIds)
    const bookings = await BookingHandler.lib.find({owner: this.model.id, from: {$gte: new Date()}})
    debug('Found bookings', bookings)
    return Promise.all(bookings.map(booking => booking._updateNotification(this.model.oneSignalPlayerIds)))
  }

  /**
   * Will create a new password-reset token with 1h. expiration.
   * @return {Promise.<TokenHandler>}
   */
  generateResetToken () {
    debug('Generating reset token')
    return this._generateToken(uuid.v4(), 'reset')
      .then(token => this._revokeResetToken().then(() => {
        debug('Generated token', token.model._id)
        this.model.resetPassword = {
          token: token.model._id,
          expire: Date.now() + 3600000
        }
        return this.model.save().then(() => token)
      }))
  }

  _fetchPasswordResetToken () {
    return TokenHandler
      .lib.findFromId(this.model.resetPassword.token)
  }

  async _revokeResetToken () {
    if (!this.model.resetPassword.token) return
    const token = await this._fetchPasswordResetToken()
    this.model.resetPassword = {}
    await Promise.all([token && token.deleteToken(), this.model.save()])
  }

  /**
   * Create a new calendar token
   * @returns {Promise.<TokenHandler>}
   */
  generateCalendarToken () {
    debug('Generating calendar token')
    return this
      ._generateToken(uuid.v4(), 'calendar')
      .then(token => {
        debug('Token ', token.model.id)
        this.model.calendarTokensReferences.push(token.model._id)
        return this.model.save().then(() => token)
      })
  }

  /**
   * Verifies a calendar token
   * @param {string} secret
   * @returns {Promise.<boolean>|*}
   */
  verifyCalendarToken (secret: string) {
    debug('Verifying calendar token', this.model.calendarTokensReferences)
    return TokenHandler.lib
      .findTokenFromSecret(secret, {_id: {$in: this.model.calendarTokensReferences}})
      .then(Boolean)
  }

  /**
   * Lists bookings as events
   * @returns {Promise.<{start: Date, end: Date, uid: string, timestamp: Date, url: string, summary: string}[]>}
   */
  generateEvents () {
    return this
      .fetchLaundries()
      .then(laundries => Promise.all(laundries.map(l => l.generateEvents())))
      .then(events => events.reduce((l1, l2) => l1.concat(l2), []))
  }

  /**
   * Finds the laundries owned by this user
   * @return {Promise<LaundryHandler[]>}
   */
  findOwnedLaundries () {
    return LaundryHandler.lib.find({owners: this.model._id})
  }

  /**
   * Find a auth token from given secret
   * @param secret
   * @return {Promise.<TokenHandler>}
   */
  findAuthTokenFromSecret (secret: string): Promise<?TokenHandler> {
    return TokenHandler.lib.findTokenFromSecret(secret, {_id: {$in: this.model.authTokens}})
  }

  fetchAuthTokens () {
    return TokenHandler.lib.find({_id: {$in: this.model.authTokens}})
  }

  _fetchUserTokens () {
    return TokenHandler.lib.find({owner: this.model._id})
  }

  /**
   * Generates a new auth token associated with this account.
   * @param {string} name
   * @return {Promise.<TokenHandler>}
   */
  async generateAuthToken (name: string): Promise<TokenHandler> {
    const token = await this._generateToken(name, 'auth')
    this.model.authTokens.push(token.model._id)
    await this.model.save()
    return token
  }

  _generateToken (name: string, type: *) {
    return TokenHandler.lib._createToken(this, name, type)
  }

  /**
   * Update the name of the user.
   * @param name
   */
  async updateName (name: string) {
    this.model.overrideDisplayName = name
    await this.model
      .save()
    this.lib.emitEvent('update', this)
    return this
  }

  /**
   * Update the role of the user
   * @param role
   * @returns {Promise}
   */
  async updateRole (role: UserRole) {
    this.model.role = role
    await this.model.save()
    this.lib.emitEvent('update', this)
  }

  /**
   * Create a new laundry with the current user as owner.
   * @param {string} name
   * @param {string=} timeZone
   * @param {string=} googlePlaceId
   * @return {Promise.<LaundryHandler>}
   */
  createLaundry (name: string, timeZone: string = '', googlePlaceId: string = '') {
    return LaundryHandler.lib.createLaundry(this, name, false, timeZone, googlePlaceId)
  }

  /**
   * Add this user as a user on the given laundry.
   * @param {LaundryHandler} laundry
   * @return {Promise.<UserHandler>}
   */
  _addLaundry (laundry: LaundryHandler) {
    this.model.laundries.push(laundry.model._id)
    return this.save()
  }

  _removeLaundry (laundry: LaundryHandler) {
    this.model.laundries.pull(laundry.model._id)
    return this.save()
  }

  /**
   * Remove provided token
   * @param {TokenHandler} token
   * @return {Promise.<UserHandler>}
   */
  async removeAuthToken (token: TokenHandler) {
    await token.deleteToken()
    this.model.authTokens.pull(token.model._id)
    await this.model.save()
    return this
  }

  fetchLaundries () : Promise<LaundryHandler[]> {
    return LaundryHandler.lib.find({_id: {$in: this.model.laundries}})
  }

  /**
   * Will create a new email verification.
   * @param {string} email
   * @return {Promise.<TokenHandler>}
   */
  async generateVerifyEmailToken (email: string) {
    email = email.toLowerCase()
    if (this.model.emails.indexOf(email) < 0) return Promise.resolve()
    const token = await this._generateToken(uuid.v4(), 'verification')
    const cleanTokens = this.model.pendingExplicitEmailVerifications.filter(v => v.email !== email)
    cleanTokens.push({email: email, token: token.model._id})
    this.model.pendingExplicitEmailVerifications = cleanTokens
    await this.model.save()
    return token
  }

  /**
   * Will verify a given email against the latest generated token.
   * @param {string} email
   * @param {string} token
   * @returns {Promise.<boolean>}
   */
  async verifyEmail (email: string, token: string): Promise<boolean> {
    email = email.toLowerCase()
    const storedToken = this.model.pendingExplicitEmailVerifications.find(element => element.email === email)
    if (!storedToken) return false
    const t = await TokenHandler.lib.findFromId(storedToken.token)
    if (!t) return false
    const result = await t.verify(token)
    if (!result) return false
    this.model.pendingExplicitEmailVerifications = this.model.pendingExplicitEmailVerifications
      .filter(element => element.email !== email)
    this.model.explicitVerifiedEmails.push(email)
    await this.model.save()
    return true
  }

  isVerified (email: string) {
    return this.model.verifiedEmails.indexOf(email.toLowerCase()) >= 0
  }

  async addLaundriesFromInvites () {
    const invites = await LaundryInvitationHandler.lib.find({email: {$in: this.model.emails}})
    const laundries = await LaundryHandler.lib.find({_id: {$in: invites.map(({model: {laundry}}) => laundry)}})
    await Promise.all(laundries.map((laundry) => laundry.addUser(this)))
    await Promise.all(invites.map((invite) => invite.markUsed()))
  }

  resetPassword (password: string) {
    return Promise.all([
      pwd.hashPassword(password)
        .then(hash => {
          this.model.password = hash
          return this.model.save()
        }),
      this._revokeResetToken()])
  }

  /**
   * Verifies given password.
   * @param {string} password
   * @return {Promise.<boolean>}
   */
  verifyPassword (password: string) {
    if (this.model.password) return pwd.comparePassword(password, this.model.password)
    return this.verifyOneTimePassword(password)
  }

  async verifyOneTimePassword (password: string) {
    if (!this.model.oneTimePassword) {
      return false
    }
    const result = await pwd.comparePassword(password, this.model.oneTimePassword)
    if (!result) return result
    this.model.oneTimePassword = undefined
    await this.model.save()
    return true
  }

  /**
   * Verifies a given token.
   * @param {string} token
   * @return {Promise.<boolean>}
   */
  async verifyResetPasswordToken (token: string) {
    debug('Verify reset password token', token, this.model.resetPassword)
    if (!this.model.resetPassword.token) return false
    if (!this.model.resetPassword.expire) return false
    if (new Date() > this.model.resetPassword.expire) return false
    const tok = await this._fetchPasswordResetToken()
    if (!tok) {
      return false
    }
    return tok.verify(token)
  }

  deleteUser () {
    return Promise.all([
      this.fetchLaundries().then(ls => Promise.all(ls.map(l => l.removeUser(this)))),
      this._fetchUserTokens().then(ts => Promise.all(ts.map(t => t.deleteToken())))
    ])
      .then(() => this.model.remove())
      .then(() => this)
  }

  /**
   * Update the last seen variable to now
   * @return {Promise.<Date>}
   */
  seen () {
    const date = new Date()
    this.model.lastSeen = date
    return this.model.save().then((model) => {
      this.model = model
      return date
    })
  }

  /**
   * Sets the perfered locale of this user
   * @param {string} locale
   * @returns {Promise}
   */
  setLocale (locale: string) {
    debug(`Setting locale of user ${this.model.displayName} to ${locale}`)
    this.model.locale = locale
    return this.save()
  }

  restUrl = `/api/users/${this.model.id}`

  photo (): ?string {
    const profile = this.model.latestProfile
    const photo = profile.photos && profile.photos.length && profile.photos[0].value
    if (!photo) return null
    if (profile.provider !== 'google') return photo || undefined
    const matches = photo.match(/sz=([0-9]+)$/)
    if (!matches) return photo
    return photo.substr(0, photo.length - matches[1].length) + '200'
  }

  isDemo (): boolean {
    return this.model.demo
  }

  isAdmin (): boolean {
    return this.model.role === 'admin'
  }

  hasPassword (): boolean {
    return Boolean(this.model.password)
  }

  toRest () {
    return this.fetchAuthTokens()
      .then(tokens => ({
        id: this.model.id,
        displayName: this.model.displayName,
        lastSeen: this.model.lastSeen ? this.model.lastSeen.toISOString() : undefined,
        name: {
          familyName: this.model.name.familyName,
          givenName: this.model.name.givenName,
          middleName: this.model.name.middleName
        },
        tokens: tokens.map(t => t.toRestSummary()),
        photo: this.photo() || '',
        href: this.restUrl
      }))
  }

  toRestSummary () {
    return {
      id: this.model.id,
      displayName: this.model.displayName,
      href: this.restUrl
    }
  }

  reduxModel (): User {
    return {
      id: this.model.id,
      photo: this.photo() || `/identicon/${str.hash(this.model.id)}/150.svg`,
      displayName: this.model.displayName,
      laundries: this.model.laundries.map((id) => id.toString()),
      lastSeen: this.model.lastSeen,
      role: this.model.role,
      demo: Boolean(this.model.demo)
    }
  }
}
