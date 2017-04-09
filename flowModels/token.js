// @flow

import mongoose from 'mongoose'
import { Document } from './document'
type ObjectId = mongoose$ObjectId

const Schema = mongoose.Schema

export interface TokenDocument extends Document {
  name: string,
  hash: string,
  type: string,
  owner: ObjectId,
  lastSeen: ?Date
}

const tokenSchema = new Schema({
  name: {type: Schema.Types.String, required: true, trim: true},
  hash: {type: Schema.Types.String, required: true},
  type: {type: Schema.Types.String, enum: ['auth', 'calendar', 'reset', 'verification'], default: 'auth'},
  owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  lastSeen: Date
}, {timestamps: true})

tokenSchema.index({name: 1, owner: 1}, {unique: true})

tokenSchema.index({'name': 1})

export const TokenModel: Class<TokenDocument> = mongoose.model('Token', tokenSchema)
