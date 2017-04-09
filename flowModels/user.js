// @flow

import type { Document, Model } from './document'
import mongoose from 'mongoose'
const Schema = mongoose.Schema
type Field = mongoose$SchemaFieldDeclaration
type Declaration = mongoose$SchemaDeclaration
type ObjectId = mongoose$ObjectId

export type Profile = {
  provider: ?string,
  id: ?string,
  displayName: ?string,
  name: ?{
    familyName: ?string,
    givenName: ?string,
    middleName: ?string
  },
  emails: { value: ?string, type: ?string }[],
  photos: { value: ?string }[]
}

export interface UserDocument extends Document {
  role: string,
  demo: ?boolean,
  oneTimePassword: ?string,
  password: ?string,
  resetPassword: ?{
    token: ObjectId,
    expire: Date
  },
  latestProvider: ?string,
  lastSeen: ?Date,
  locale: ?string,
  overrideDisplayName: ?string,
  authTokens: ObjectId[],
  calendarTokensReferences: ObjectId[],
  laundries: ObjectId[],
  explicitVerifiedEmails: string[],
  pendingExplicitEmailVerifications: { email: string, token: ObjectId }[],
  profiles: Profile[],
  constructor(doc: {
    role: string,
    demo?: boolean,
    oneTimePassword?: string,
    password?: string,
    resetPassword?: {
      token: ObjectId,
      expire: Date
    },
    latestProvider?: ?string,
    lastSeen?: Date,
    locale?: string,
    overrideDisplayName?: string,
    authTokens: ObjectId[],
    calendarTokensReferences: ObjectId[],
    laundries: ObjectId[],
    explicitVerifiedEmails: string[],
    pendingExplicitEmailVerifications: { email: string, token: ObjectId }[],
    profiles: Profile[],
  }): UserDocument
}

const userSchema = new Schema({
  role: ({type: Schema.Types.String, default: 'user', enum: ['user', 'admin']}: Field),
  docVersion: Schema.Types.Number,
  demo: Schema.Types.Boolean,
  oneTimePassword: Schema.Types.String,
  password: Schema.Types.String,
  resetPassword: {
    token: {required: true, type: Schema.Types.ObjectId, ref: 'Token'},
    expire: {required: true, type: Schema.Types.Date}
  },
  latestProvider: Schema.Types.String,
  lastSeen: Schema.Types.Date,
  locale: Schema.Types.String,
  overrideDisplayName: Schema.Types.String,
  authTokens: [{type: Schema.Types.ObjectId, ref: 'Token'}],
  calendarTokensReferences: [{type: Schema.Types.ObjectId, ref: 'Token'}],
  laundries: [({type: Schema.Types.ObjectId, ref: 'Laundry'}: Field)],
  explicitVerifiedEmails: [({type: Schema.Types.String}: Field)],
  pendingExplicitEmailVerifications: [{
    email: {type: Schema.Types.String, required: true},
    token: {type: Schema.Types.ObjectId, ref: 'Token', required: true}
  }],
  profiles: [({
    provider: Schema.Types.String,
    id: Schema.Types.String,
    displayName: Schema.Types.String,
    name: {
      familyName: Schema.Types.String,
      givenName: Schema.Types.String,
      middleName: Schema.Types.String
    },
    emails: [({value: Schema.Types.String, type: ({type: Schema.Types.String}: Field)}: Declaration)],
    photos: [{value: Schema.Types.String}]
  }: Declaration)]
}, {timestamps: true})

userSchema.index({reference: 1})
userSchema.index({createdAt: 1})

export const UserModel: Class<UserDocument> = mongoose.model('User', userSchema)
