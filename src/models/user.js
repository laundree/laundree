// @flow
import mongoose from 'mongoose'
import type { ObjectId } from 'mongoose'
import { union } from '../utils/array'
const Schema = mongoose.Schema

export type UserRole = 'user' | 'admin'

type Name = {
  familyName?: string,
  givenName?: string,
  middleName?: string
}

export type Profile = {
  provider: string,
  id: string,
  displayName: string,
  name: Name,
  emails: { value: string, type?: string }[],
  photos?: { value: string }[]
}
type UserDefinition = {
  docVersion: number,
  role: UserRole,
  demo: boolean,
  oneTimePassword?: string,
  password?: string,
  resetPassword: {
    token: ObjectId,
    expire: Date
  },
  latestProvider?: string,
  lastSeen?: Date,
  locale?: string,
  oneSignalPlayerIds: string[],
  overrideDisplayName?: string,
  authTokens: ObjectId[],
  calendarTokensReferences: ObjectId[],
  laundries: ObjectId[],
  explicitVerifiedEmails: string[],
  pendingExplicitEmailVerifications: {
    email: string,
    token: ObjectId
  }[],
  profiles: Profile[],
  latestProfile: ?Profile,
  displayName: ?string,
  name: Name,
  emails: string[],
  implicitVerifiedEmails: string[],
  verifiedEmails: string[],
  photo: string
}

const userSchema: Schema<UserDefinition> = new Schema({
  role: {type: String, default: 'user', enum: ['user', 'admin']},
  docVersion: {type: Number},
  demo: {type: Boolean, default: false},
  oneTimePassword: {type: String},
  password: {type: String},
  resetPassword: {
    token: {type: Schema.Types.ObjectId, ref: 'Token'},
    expire: Date
  },
  latestProvider: String,
  lastSeen: Date,
  locale: String,
  oneSignalPlayerIds: [String],
  overrideDisplayName: String,
  authTokens: [{type: Schema.Types.ObjectId, ref: 'Token'}],
  calendarTokensReferences: [{type: Schema.Types.ObjectId, ref: 'Token'}],
  laundries: [{type: Schema.Types.ObjectId, ref: 'Laundry'}],
  explicitVerifiedEmails: [{type: String}],
  pendingExplicitEmailVerifications: [{
    email: {type: String, required: true},
    token: {type: Schema.Types.ObjectId, ref: 'Token'}
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
    const profile = this.latestProfile
    if (!profile) return null
    return profile.name
  })

userSchema
  .virtual('emails')
  .get(function () {
    const emailMap = this.profiles.reduce((obj, profile) => profile.emails.reduce((obj, email) => {
      obj[email.value] = true
      return obj
    }, obj), {})
    return Object.keys(emailMap)
  })

userSchema
  .virtual('implicitVerifiedEmails')
  .get(function () {
    const emailMap = this.profiles.reduce((obj, profile) => {
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
    const profile = this.latestProfile
    if (!profile) return ''
    if (!profile.photos) return ''
    if (!profile.photos.length) return ''
    return profile.photos[0].value
  })

export default mongoose.model('User', userSchema)

