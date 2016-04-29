/**
 * Created by budde on 27/04/16.
 */

var Handler = require('./handler')
var UserModel = require('../models').UserModel

/**
 * @typedef {{provider: string, id: string, displayName: string, name: {familyName: string=, middleName: string=, givenName: string=}, emails: {value: string, type: string=}[], photos: {value: string}[]=}} Profile
 */

class UserHandler extends Handler {

  /**
   * Find an handler from given id.
   * @param id
   * @returns {Promise.<UserHandler>}
   */
  static findFromId (id) {
    return UserModel.findFromId(id)
      .exec()
      .then((m) => m ? new UserHandler(m) : undefined)
  }

  /**
   * Find a user from given email address.
   * @param {string} email
   * @return {Promise.<UserHandler>}
   */
  static findFromEmail (email) {
    return UserModel.findOne({email: email.toLowerCase().trim()}).exec().then((userModel) => userModel ? new UserHandler(userModel) : undefined)
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
   * Create a new user from given profile.
   * @param {Profile} profile
   * @return {Promise.<UserHandler>}
   */
  static createUserFromProfile (profile) {
    if (!profile.emails || !profile.emails.length) return Promise.resolve()
    return new UserModel({
      email: profile.emails[0].value,
      profiles: [profile]
    }).save().then((model) => new UserHandler(model))
  }
}

module.exports = UserHandler
