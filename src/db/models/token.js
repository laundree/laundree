// @flow
import mongoose from 'mongoose'
import type { ObjectId } from 'mongoose'

const Schema = mongoose.Schema

export type TokenType = 'auth' | 'calendar' | 'reset' | 'verification'

export type TokenDefinition = {
  name: string,
  hash?: string,
  type: TokenType,
  owner: ObjectId,
  lastSeen?: Date
}

const tokenSchema: Schema<TokenDefinition> = new Schema({
  name: {type: String, required: true, trim: true},
  hash: {type: String},
  type: {type: String, enum: ['auth', 'calendar', 'reset', 'verification'], default: 'auth'},
  owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  lastSeen: Date
}, {timestamps: true, usePushEach: true})

tokenSchema.index({name: 1, owner: 1}, {unique: true})

tokenSchema.index({'name': 1})

export default mongoose.model('Token', tokenSchema)
