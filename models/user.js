/**
 * Created by budde on 27/04/16.
 */
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var lodash = require('lodash')

var userSchema = new Schema({
  password: {type: String},
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  latestProvider: String,
  authTokens: [{type: Schema.Types.ObjectId, ref: 'Token'}],
  explicitVerifiedEmails: [{type: String}],
  explicitVerificationEmailTokens: [{
    email: {type: String, required: true},
    hash: {type: String, required: true},
    created: {type: Date, required: true, default: Date.now}
  }],
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
  }],
  createdAt: {type: Date},
  updatedAt: {type: Date}
}, {
  toObject: {virtuals: true},
  toJSON: {virtuals: true}
})

userSchema.pre('save', function (next) {
  var now = new Date()
  this.updatedAt = now
  if (!this.createdAt) {
    this.createdAt = now
  }
  next()
})

userSchema.index({'profiles.emails.value': 1})
userSchema
  .virtual('latestProfile')
  .get(function () {
    if (!this.latestProvider) return null
    return lodash.find(this.profiles, (profile) => profile.provider === this.latestProvider) || null
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
    var emailMap = this.profiles.reduce((obj, profile) => profile.emails.reduce((obj, email) => {
      obj[email.value] = true
      return obj
    }, obj), {})
    return Object.keys(emailMap)
  })

userSchema
  .virtual('implicitVerifiedEmails')
  .get(function () {
    var emailMap = this.profiles.reduce((obj, profile) => {
      if (['google', 'facebook'].indexOf(profile.provider) < 0) return obj
      return profile.emails.reduce((obj, email) => {
        obj[email.value] = true
        return obj
      }, obj)
    }, {})
    return Object.keys(emailMap)
  })

userSchema
  .virtual('verifiedEmails')
  .get(function () {
    return lodash.union(this.explicitVerifiedEmails, this.implicitVerifiedEmails)
  })

userSchema
  .virtual('photo')
  .get(function () {
    var profile = this.latestProfile
    if (!profile) return ''
    if (!profile.photos) return ''
    if (!profile.photos.length) return ''
    return profile.photos[0].value
  })

/**
 * Find from id string
 * @param {string} id
 */
userSchema.statics.findFromId = (id) => UserModel.findById(new mongoose.Types.ObjectId(id))

var UserModel = mongoose.model('User', userSchema)

module.exports = UserModel
