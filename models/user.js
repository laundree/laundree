/**
 * Created by budde on 27/04/16.
 */
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var _ = require('lodash')

var userSchema = new Schema({
  password: {type: String},
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  latestProvider: String,
  profiles: [{
    provider: String,
    id: String,
    displayName: String,
    name: {
      familyName: String,
      givenName: String,
      middleName: String
    },
    emails: [{value: String, type: {type: String}}],
    photos: [{value: String}]
  }]
}, {
  toObject: {virtuals: true},
  toJSON: {virtuals: true}
})
userSchema.index({'profiles.emails.value': 1})
userSchema
  .virtual('latestProfile')
  .get(function () {
    if (!this.latestProvider) return null
    return _.find(this.profiles, (profile) => profile.provider === this.latestProvider) || null
  })

function fromLatestProfile (attribute) {
  userSchema
    .virtual(attribute)
    .get(function () {
      var profile = this.latestProfile
      if (!profile) return null
      return profile[attribute]
    })
}

fromLatestProfile('displayName')

fromLatestProfile('name')

userSchema
  .virtual('emails')
  .get(function () {
    var emails = this.profiles
      .reduce((prev, profile) => prev.concat(profile.emails.map((email) => email.value)), [])
    var seen = {}
    return emails.filter((item, pos) => seen.hasOwnProperty(item) ? false : (seen[item] = true))
  })

userSchema
  .virtual('photo')
  .get(function () {
    var profile = this.latestProfile
    if (!profile) return null
    if (!profile.photos) return null
    if (!profile.photos.length) return null
    return profile.photos[0].value
  })

/**
 * Find from id string
 * @param {string} id
 */
userSchema.statics.findFromId = (id) => UserModel.findById(new mongoose.Types.ObjectId(id))

var UserModel = mongoose.model('User', userSchema)

module.exports = UserModel
