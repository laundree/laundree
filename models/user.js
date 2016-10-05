/**
 * Created by budde on 27/04/16.
 */
var mongoose = require('mongoose')
var Schema = mongoose.Schema
const {union} = require('../utils/array')

var userSchema = new Schema({
  role: {type: String, default: 'user', enum: ['user', 'admin']},
  oneTimePassword: {type: String},
  password: {type: String},
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  latestProvider: String,
  lastSeen: Date,
  overrideDisplayName: String,
  authTokens: [{type: Schema.Types.ObjectId, ref: 'Token'}],
  laundries: [{type: Schema.Types.ObjectId, ref: 'Laundry'}],
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
  }]
}, {timestamps: true})

userSchema.index({'profiles.emails.value': 1})
userSchema
  .virtual('latestProfile')
  .get(function () {
    if (!this.latestProvider) return null
    return this.profiles.find((profile) => profile.provider === this.latestProvider) || null
  })

userSchema
  .virtual('displayName')
  .get(function () {
    if (this.overrideDisplayName) return this.overrideDisplayName
    const profile = this.latestProfile
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
    return union(this.explicitVerifiedEmails, this.implicitVerifiedEmails)
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

var UserModel = mongoose.model('User', userSchema)

module.exports = UserModel
