/**
 * Created by budde on 27/04/16.
 */

const Handler = require('./handler')
const TokenHandler = require('./token')
const LaundryInvitationHandler = require('./laundry_invitation')
const {UserModel} = require('../models')
const lodash = require('lodash')
const utils = require('../utils')
const Promise = require('promise')

/**
 * @param {string}displayName
 * @return {{givenName: string=, middleName: string=, lastName: string=}}
 */
function displayNameToName (displayName) {
  var names = displayName.split(' ')
  names = names.filter((name) => name.length)
  const noNames = names.length
  if (noNames === 0) return {}
  if (noNames === 1) return {givenName: names[0]}
  if (noNames === 2) return {givenName: names[0], familyName: names[1]}
  return {
    givenName: names[0],
    middleName: lodash.slice(names, 1, names.length - 1).join(' '),
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
    return UserHandler.findFromEmail(profile.emails[0].value).then((user) => user ? user.updateProfile(profile) : UserHandler.createUserFromProfile(profile))
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
   * @return {Promise.<string>}
   */
  generateResetToken () {
    return utils.password.generateToken().then((token) => {
      return utils.password.hashPassword(token).then((hash) => {
        this.model.resetPasswordToken = hash
        this.model.resetPasswordExpire = Date.now() + 3600000
        return this.model.save().then(() => token)
      })
    })
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
    return UserModel
      .populate(this.model, {path: 'authTokens', model: 'Token'})
      .then((model) =>
        model.authTokens
          .map((token) => new TokenHandler(token))
          .reduce((prev, token) =>
              prev
                .then((oldToken) => oldToken || token
                  .verify(secret)
                  .then((result) => result ? token : null)),
            Promise.resolve(null)))
  }

  /**
   * Generates a new auth token associated with this account.
   * @param {string} name
   * @return {Promise.<TokenHandler>}
   */
  generateAuthToken (name) {
    return TokenHandler._createToken(this, name).then((token) => {
      this.model.authTokens.push(token.model._id)
      return this.model.save().then(() => token)
    })
  }

  /**
   * Create a new laundry with the current user as owner.
   * @param {string} name
   * @return {Promise.<LaundryHandler>}
   */
  createLaundry (name) {
    const LaundryHandler = require('./laundry')
    return LaundryHandler.createLaundry(this, name)
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
    return UserModel.populate(this.model, {path: 'laundries'})
      .then(({laundries}) => laundries.map((l) => new LaundryHandler(l)))
  }

  /**
   * Will create a new email verification.
   * @param {string} email
   * @return {Promise.<string>}
   */
  generateVerifyEmailToken (email) {
    email = email.toLowerCase()
    if (this.model.emails.indexOf(email) < 0) return Promise.resolve()
    return utils.password
      .generateToken()
      .then((token) => utils.password.hashPassword(token).then((hash) => {
        const cleanTokens = this.model.explicitVerificationEmailTokens.filter((token) => token.email !== email)
        cleanTokens.push({email: email, hash: hash})
        this.model.explicitVerificationEmailTokens = cleanTokens
        return this.model.save().then(() => token)
      }))
  }

  /**
   * Will verify a given email against the latest generated token.
   * @param {string} email
   * @param {string} token
   * @returns {Promise.<boolean>}
   */
  verifyEmail (email, token) {
    email = email.toLowerCase()
    const storedToken = this.model.explicitVerificationEmailTokens.find((element) => element.email === email)
    if (!storedToken) return Promise.resolve(false)
    return utils.password.comparePassword(token, storedToken.hash).then((result) => {
      if (!result) return false
      this.model.explicitVerificationEmailTokens = this.model.explicitVerificationEmailTokens
        .filter((element) => element.email !== email)
      this.model.explicitVerifiedEmails.push(email)
      return this.model.save().then(() => true)
    })
  }

  /**
   * Create a new user from given profile.
   * @param {Profile} profile
   * @return {Promise.<UserHandler>}
   */
  static createUserFromProfile (profile) {
    if (!profile.emails || !profile.emails.length) return Promise.resolve()
    return new UserModel({
      profiles: [Object.assign({}, profile, {emails: profile.emails.map(({value}) => ({value: value.toLowerCase()}))})],
      latestProvider: profile.provider
    }).save()
      .then((model) => new UserHandler(model))
      .then((user) => {
        user.emitEvent('create')
        return user.addLaundriesFromInvites().then(() => user)
      })
  }

  static createUserWithPassword (displayName, email, password) {
    displayName = displayName.split(' ').filter((name) => name.length).join(' ')

    const profile = {
      id: email,
      displayName: displayName,
      name: displayNameToName(displayName),
      provider: 'local',
      emails: [{value: email}],
      photos: [{value: `/identicon/${email}/150.svg`}]
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
    return utils.password.hashPassword(password)
      .then((hash) => {
        this.model.password = hash
        this.model.resetPasswordToken = undefined
        this.model.resetPasswordExpire = undefined
        return this.model.save()
      }).then((model) => {
        this.model = model
        return this
      })
  }

  /**
   * Verifies given password.
   * @param {string} password
   * @return {Promise.<boolean>}
   */
  verifyPassword (password) {
    if (!this.model.password) return Promise.resolve(false)
    return utils.password.comparePassword(password, this.model.password)
  }

  /**
   * Verifies a given token.
   * @param {string} token
   * @return {Promise.<boolean>}
   */
  verifyResetPasswordToken (token) {
    if (!this.model.resetPasswordToken) return Promise.resolve(false)
    if (!this.model.resetPasswordExpire) return Promise.resolve(false)
    if (new Date() > this.model.resetPasswordExpire) return Promise.resolve(false)
    return utils.password.comparePassword(token, this.model.resetPasswordToken)
  }

  deleteUser () {
    const LaundryHandler = require('./laundry')
    return UserModel.populate(this.model, {path: 'authTokens laundries'})
      .then((model) =>
        Promise.all([
          Promise.all(model.authTokens.map((t) => new TokenHandler(t).deleteToken())),
          Promise.all(model.laundries.map((l) => new LaundryHandler(l).removeUser(this)))]))
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

  get restUrl () {
    return `/api/users/${this.model.id}`
  }

  toRest () {
    return UserModel
      .populate(this.model, {path: 'tokens', model: 'Token'})
      .then((model) => ({
        id: this.model.id,
        displayName: this.model.displayName,
        lastSeen: this.model.lastSeen,
        name: {
          familyName: this.model.name.familyName,
          givenName: this.model.name.givenName,
          middleName: this.model.name.middleName
        },
        tokens: model.authTokens.map((t) => new TokenHandler(t).toRestSummary()),
        photo: this.model.photo,
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
}

Handler.setupHandler(UserHandler, UserModel)

module.exports = UserHandler
