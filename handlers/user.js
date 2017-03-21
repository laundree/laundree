/**
 * Created by budde on 27/04/16.
 */

const Handler = require('./handler')
const TokenHandler = require('./token')
const LaundryInvitationHandler = require('./laundry_invitation')
const {UserModel} = require('../models')
const utils = require('../utils')
const uuid = require('uuid')
const {types: {UPDATE_USER}} = require('../redux/actions')
const config = require('config')
const debug = require('debug')('laundree.handlers.user')

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

class UserHandler extends Handler {
  /**
   * Find a user from given email address.
   * @param {string} email
   * @return {Promise.<UserHandler>}
   */
  static findFromEmail (email) {
    return UserModel.findOne({'profiles.emails.value': email.toLowerCase().trim()})
      .exec()
      .then((userModel) => userModel ? new UserHandler(userModel) : undefined)
  }

  /**
   * Find or create a user from profile.
   * @param {Profile} profile
   * @return {Promise.<UserHandler>}
   */
  static findOrCreateFromProfile (profile) {
    if (!profile.emails || !profile.emails.length) return Promise.resolve()
    return UserHandler
      .findFromEmail(profile.emails[0].value)
      .then((user) => user
        ? user.updateProfile(profile)
        : UserHandler.createUserFromProfile(profile))
  }

  /**
   *
   * @param {string} userId
   * @param {string} secret
   * @returns {Promise.<{user: UserHandler=, token: TokenHandler=}>}
   */
  static findFromIdWithTokenSecret (userId, secret) {
    return UserHandler
      .findFromId(userId)
      .then(user => {
        if (!user) return {}
        return user
          .findAuthTokenFromSecret(secret)
          .then(token => {
            if (!token) return {}
            return {user, token}
          })
      })
  }

  /**
   * Finds a user from verified email and valid password
   * @param email
   * @param password
   * @returns {Promise.<UserHandler>}
   */
  static findFromVerifiedEmailAndVerifyPassword (email, password) {
    return UserHandler.findFromEmail(email)
      .then(user => {
        if (!user) return
        if (!user.isVerified(email)) return
        return user.verifyPassword(password)
          .then(result => result ? user : undefined)
      })
  }

  /**
   * Will eventually add profile if a profile with the same provider isn't present, or
   * replace the existing profile if it is.
   *
   * @param {Profile} profile
   * @return {Promise.<UserHandler>}
   */
  updateProfile (profile) {
    this.model.profiles = this.model.profiles.filter((p) => p.provider !== profile.provider)
    this.model.profiles.push(profile)
    this.model.latestProvider = profile.provider
    return this.save()
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
      .findFromId(this.model.resetPassword.token)
  }

  _revokeResetToken () {
    if (!this.model.resetPassword.token) return Promise.resolve()
    return this._fetchPasswordResetToken().then(token => {
      this.model.resetPassword = {}
      return Promise.all([token.deleteToken(), this.model.save()])
    })
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
  verifyCalendarToken (secret) {
    debug('Verifying calendar token', this.model.calendarTokensReferences)
    return TokenHandler
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
   * @returns {boolean}
   */
  get isDemo () {
    return Boolean(this.model.demo)
  }

  /**
   * Finds the laundries owned by this user
   * @return {Promise<LaundryHandler[]>}
   */
  findOwnedLaundries () {
    const LaundryHandler = require('./laundry')
    return LaundryHandler.find({owners: this.model._id})
  }

  /**
   * Find a auth token from given secret
   * @param secret
   * @return {Promise.<TokenHandler>}
   */
  findAuthTokenFromSecret (secret) {
    return TokenHandler.findTokenFromSecret(secret, {_id: {$in: this.model.authTokens}})
  }

  fetchAuthTokens () {
    return TokenHandler.find({_id: {$in: this.model.authTokens}})
  }

  _fetchUserTokens () {
    return TokenHandler.find({owner: this.model._id})
  }

  /**
   * Generates a new auth token associated with this account.
   * @param {string} name
   * @return {Promise.<TokenHandler>}
   */
  generateAuthToken (name) {
    return this._generateToken(name, 'auth')
      .then(token => {
        this.model.authTokens.push(token.model._id)
        return this.model.save().then(() => token)
      })
  }

  _generateToken (name, type) {
    return TokenHandler._createToken(this, name, type)
  }

  /**
   * Update the name of the user.
   * @param name
   */
  updateName (name) {
    this.model.overrideDisplayName = name
    return this.model
      .save()
      .then(() => this.emitEvent('update'))
      .then(() => this)
  }

  /**
   * Update the role of the user
   * @param role
   * @returns {Promise}
   */
  updateRole (role) {
    this.model.role = role
    return this.model
      .save()
      .then(() => this.emitEvent('update'))
  }

  /**
   * Create a new laundry with the current user as owner.
   * @param {string} name
   * @param {string=} timeZone
   * @param {string=} googlePlaceId
   * @return {Promise.<LaundryHandler>}
   */
  createLaundry (name, timeZone, googlePlaceId) {
    const LaundryHandler = require('./laundry')
    return LaundryHandler.createLaundry(this, name, false, timeZone, googlePlaceId)
  }

  /**
   * Add this user as a user on the given laundry.
   * @param {LaundryHandler} laundry
   * @return {Promise.<UserHandler>}
   */
  _addLaundry (laundry) {
    this.model.laundries.push(laundry.model._id)
    return this.save()
  }

  _removeLaundry (laundry) {
    this.model.laundries.pull(laundry.model._id)
    return this.save()
  }

  /**
   * Remove provided token
   * @param {TokenHandler} token
   * @return {Promise.<UserHandler>}
   */
  removeAuthToken (token) {
    return token.deleteToken()
      .then(() => {
        this.model.authTokens.pull(token.model._id)
        return this.model.save()
      })
      .then(() => this)
  }

  fetchLaundries () {
    const LaundryHandler = require('./laundry')
    return LaundryHandler.find({_id: {$in: this.model.laundries}})
  }

  /**
   * Will create a new email verification.
   * @param {string} email
   * @return {Promise.<TokenHandler>}
   */
  generateVerifyEmailToken (email) {
    email = email.toLowerCase()
    if (this.model.emails.indexOf(email) < 0) return Promise.resolve()
    return this._generateToken(uuid.v4(), 'verification')
      .then(token => {
        const cleanTokens = this.model.pendingExplicitEmailVerifications.filter(v => v.email !== email)
        cleanTokens.push({email: email, token: token.model._id})
        this.model.pendingExplicitEmailVerifications = cleanTokens
        return this.model.save().then(() => token)
      })
  }

  /**
   * Will verify a given email against the latest generated token.
   * @param {string} email
   * @param {string} token
   * @returns {Promise.<boolean>}
   */
  verifyEmail (email, token) {
    email = email.toLowerCase()
    const storedToken = this.model.pendingExplicitEmailVerifications.find(element => element.email === email)
    if (!storedToken) return Promise.resolve(false)
    return TokenHandler
      .findFromId(storedToken.token)
      .then(t => t.verify(token))
      .then(result => {
        if (!result) return false
        this.model.pendingExplicitEmailVerifications = this.model.pendingExplicitEmailVerifications
          .filter(element => element.email !== email)
        this.model.explicitVerifiedEmails.push(email)
        return this.model.save().then(() => true)
      })
  }

  isVerified (email) {
    return this.model.verifiedEmails.indexOf(email.toLowerCase()) >= 0
  }

  /**
   * Create a new user from given profile.
   * @param {Profile} profile
   * @return {Promise.<UserHandler>}
   */
  static createUserFromProfile (profile) {
    if (!profile.emails || !profile.emails.length) return Promise.resolve()
    const role = profile.emails.reduce((role, {value}) => role || config.get('defaultUsers')[value], null) || 'user'
    return new UserModel({
      docVersion: 1,
      profiles: [Object.assign({}, profile, {emails: profile.emails.map(({value}) => ({value: value.toLowerCase()}))})],
      latestProvider: profile.provider,
      role
    }).save()
      .then((model) => new UserHandler(model))
      .then((user) => {
        user.emitEvent('create')
        return user.addLaundriesFromInvites().then(() => user)
      })
  }

  /**
   * @param {String} displayName
   * @param {String} email
   * @param {String} password
   * @returns {Promise.<UserHandler>}
   */
  static createUserWithPassword (displayName, email, password) {
    displayName = displayName.split(' ').filter((name) => name.length).join(' ')

    const profile = {
      id: email,
      displayName: displayName,
      name: displayNameToName(displayName),
      provider: 'local',
      emails: [{value: email}],
      photos: [{value: `/identicon/${utils.string.hash(email)}/150.svg`}]
    }
    return Promise.all(
      [UserHandler.createUserFromProfile(profile),
        utils.password.hashPassword(password)])
      .then((result) => {
        const [user, passwordHash] = result
        user.model.password = passwordHash
        return user.model.save().then((model) => UserHandler.findFromId(model.id))
      })
  }

  /**
   * Create a demo user
   * @returns {Promise.<{email: string, user: UserHandler, password: string}>}
   */
  static createDemoUser () {
    const displayName = 'Demo user'
    const email = `demo-user-${uuid.v4()}@laundree.io`
    const profile = {
      id: email,
      displayName,
      name: displayNameToName(displayName),
      provider: 'local',
      emails: [{value: email}],
      photos: [{value: `/identicon/${utils.string.hash(email)}/150.svg`}]
    }
    return Promise
      .all([
        UserHandler.createUserFromProfile(profile),
        utils.password.generateTokenAndHash()
      ])
      .then(([user, {token, hash}]) => {
        user.model.oneTimePassword = hash
        user.model.demo = true
        user.model.explicitVerifiedEmails.push(email)
        return user.model.save().then(() => ({password: token, user, email}))
      })
  }

  addLaundriesFromInvites () {
    const LaundryHandler = require('./laundry')
    return LaundryInvitationHandler
      .find({email: {$in: this.model.emails}})
      .then((invites) => LaundryHandler
        .find({_id: {$in: invites.map(({model: {laundry}}) => laundry)}})
        .then((laundries) => Promise.all(laundries.map((laundry) => laundry.addUser(this))))
        .then(() => Promise.all(invites.map((invite) => invite.markUsed()))))
  }

  resetPassword (password) {
    return Promise.all([
      utils.password.hashPassword(password)
        .then(hash => {
          this.model.password = hash
          return this.model.save()
        }),
      this._revokeResetToken()])
  }

  get hasPassword () {
    return Boolean(this.model.password)
  }

  /**
   * Verifies given password.
   * @param {string} password
   * @return {Promise.<boolean>}
   */
  verifyPassword (password) {
    if (this.model.password) return utils.password.comparePassword(password, this.model.password)
    return this.verifyOneTimePassword(password)
  }

  verifyOneTimePassword (password) {
    if (!this.model.oneTimePassword) return Promise.resolve(false)
    return utils.password
      .comparePassword(password, this.model.oneTimePassword)
      .then(result => {
        if (!result) return result
        this.model.oneTimePassword = undefined
        return this.model.save().then(() => true)
      })
  }

  /**
   * Verifies a given token.
   * @param {string} token
   * @return {Promise.<boolean>}
   */
  verifyResetPasswordToken (token) {
    debug('Verify reset password token', token, this.model.resetPassword)
    if (!this.model.resetPassword.token) return Promise.resolve(false)
    if (!this.model.resetPassword.expire) return Promise.resolve(false)
    if (new Date() > this.model.resetPassword.expire) return Promise.resolve(false)
    return this._fetchPasswordResetToken().then(tok => tok.verify(token))
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
  setLocale (locale) {
    debug(`Setting locale of user ${this.model.displayName} to ${locale}`)
    this.model.locale = locale
    return this.save()
  }

  get restUrl () {
    return `/api/users/${this.model.id}`
  }

  get photo () {
    const profile = this.model.latestProfile
    const photo = profile.photos && profile.photos.length && profile.photos[0].value
    if (!photo) return null
    if (profile.provider !== 'google') return photo || undefined
    const matches = photo.match(/sz=([0-9]+)$/)
    if (!matches) return photo
    return photo.substr(0, photo.length - matches[1].length) + '200'
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
        photo: this.photo || '',
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

  get updateActions () {
    return [
      user => {
        user.model.calendarTokensReferences = []
        user.model.docVersion = 1
        return user.model.save().then(() => new UserHandler(user.model))
      }
    ]
  }

  get reduxModel () {
    return {
      id: this.model.id,
      photo: this.photo,
      displayName: this.model.displayName,
      laundries: this.model.laundries.map((id) => id.toString()),
      lastSeen: this.model.lastSeen,
      role: this.model.role,
      demo: this.isDemo
    }
  }

  get isAdmin () {
    return this.model.role === 'admin'
  }

  get eventData () {
    return {demo: this.isDemo}
  }
}

Handler.setupHandler(UserHandler, UserModel, {
  update: UPDATE_USER
})

module.exports = UserHandler
