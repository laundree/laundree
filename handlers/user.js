/**
 * Created by budde on 27/04/16.
 */

var Handler = require('./handler')
var UserModel = require('../models').UserModel
var _ = require('lodash')
var utils = require('../utils')

/**
 * @param {string}displayName
 * @return {{givenName: string=, middleName: string=, lastName: string=}}
 */
function displayNameToName (displayName) {
  var names = displayName.split(' ')
  names = names.filter((name) => name.length)
  var noNames = names.length
  if (noNames === 0) return {}
  if (noNames === 1) return {givenName: names[0]}
  if (noNames === 2) return {givenName: names[0], familyName: names[1]}
  return {
    givenName: names[0],
    middleName: _.slice(names, 1, names.length - 1).join(' '),
    familyName: names[names.length - 1]
  }
}

/**
 * @typedef {{provider: string, id: string, displayName: string, name: {familyName: string=, middleName: string=, givenName: string=}, emails: {value: string, type: string=}[], photos: {value: string}[]=}} Profile
 */

class UserHandler extends Handler {

  /**
   * Find users
   * @returns {Promise.<UserHandler[]>}
   */
  static find (filter, limit) {
    limit = limit || 10
    return UserModel.find(filter, null, {sort: {'_id': 1}}).limit(limit).exec().then((users) => users.map((model) => new UserHandler(model)))
  }

  /**
   * Find an handler from given id.
   * @param id
   * @returns {Promise.<UserHandler>}
   */
  static findFromId (id) {
    try {
      return UserModel.findFromId(id)
        .exec()
        .then((m) => m ? new UserHandler(m) : undefined)
    } catch (e) {
      return Promise.reject(e)
    }
  }

  /**
   * Find a user from given email address.
   * @param {string} email
   * @return {Promise.<UserHandler>}
   */
  static findFromEmail (email) {
    return UserModel.findOne({'profiles.emails.value': email.toLowerCase().trim()}).exec().then((userModel) => userModel ? new UserHandler(userModel) : undefined)
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
    return this.model.save().then((model) => {
      this.model = model
      return this
    })
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
        return this.model.save().then((model) => {
          this.model = model
          return token
        })
      })
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
      profiles: [profile],
      latestProvider: profile.provider
    }).save().then((model) => new UserHandler(model))
  }

  static createUserWithPassword (displayName, email, password) {
    displayName = displayName.split(' ').filter((name) => name.length).join(' ')

    var profile = {
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
        // noinspection UnnecessaryLocalVariableJS
        var [user, passwordHash] = result
        user.model.password = passwordHash
        return user.model.save().then((model) => {
          user.model = model
          return user
        })
      })
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

  toRest (href) {
    return {
      emails: this.model.emails,
      id: this.model.id,
      displayName: this.model.displayName,
      name: {
        familyName: this.model.name.familyName,
        givenName: this.model.name.givenName,
        middleName: this.model.name.middleName
      },
      photo: this.model.photo,
      href: href
    }
  }
}

module.exports = UserHandler
