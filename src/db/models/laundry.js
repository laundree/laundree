// @flow
import mongoose from 'mongoose'
import type { ObjectId } from 'mongoose'

const {Schema} = mongoose

export type LaundryRules = {
  limit?: number,
  dailyLimit?: number,
  timeLimit?: {
    from: { hour: number, minute: number },
    to: { hour: number, minute: number }
  }
}

type LaundryDefinition = {
  name: string,
  machines: ObjectId[],
  owners: ObjectId[],
  users: ObjectId[],
  invites: ObjectId[],
  demo: boolean,
  rules: LaundryRules,
  googlePlaceId?: string,
  timezone?: string,
  signUpCodes: string[]
}

const laundrySchema: Schema<LaundryDefinition> = new Schema({
  name: {type: String, unique: true, trim: true, required: true},
  machines: [{type: Schema.Types.ObjectId, ref: 'Machine'}],
  owners: [{type: Schema.Types.ObjectId, ref: 'User'}],
  users: [{type: Schema.Types.ObjectId, ref: 'User'}],
  invites: [{type: Schema.Types.ObjectId, ref: 'LaundryInvitation'}],
  demo: {type: Boolean, default: false},
  rules: {
    limit: Number,
    dailyLimit: Number,
    timeLimit: {
      from: {hour: Number, minute: Number},
      to: {hour: Number, minute: Number}
    }
  },
  googlePlaceId: {type: String},
  timezone: {type: String},
  signUpCodes: [String]
}, {timestamps: true, usePushEach: true})

laundrySchema.index({'name': 1})
laundrySchema.index({'users': 1})

export default mongoose.model('Laundry', laundrySchema)
