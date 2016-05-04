/**
 * Created by budde on 27/04/16.
 */
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var _ = require('lodash')

var userSchema = new Schema({
  email: {type: String, required: true, trim: true, lowercase: true, unique: true},
  password: {type: String},
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

userSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    return {
      email: ret.email,
      latestProvider: ret.latestProvider,
      profiles: ret.profiles.map((profile) => ({
        provider: profile.provider,
        id: profile.id,
        displayName: profile.displayName,
        name: {
          familyName: profile.name.familyName,
          givenName: profile.name.givenName,
          middleName: profile.name.middleName
        },
        emails: profile.emails.map((mail) => ({value: mail.value, type: mail.type})),
        photos: profile.emails.map((photo) => ({value: photo.value}))
      }))
    }
  }
})

userSchema
  .virtual('latestProfile')
  .get(function () {
    if (!this.latestProvider) return null
    return _.find(this.profiles, (profile) => profile.provider === this.latestProvider) || null
  })

userSchema
  .virtual('displayName')
  .get(function () {
    var profile = this.latestProfile
    if (!profile) return null
    return profile.displayName
  })

userSchema
  .virtual('name')
  .get(function () {
    var profile = this.latestProfile
    if (!profile) return null
    return profile.name
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
