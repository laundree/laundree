// @flow
import mongoose from 'mongoose'
import type {ObjectId} from 'mongoose'
const Schema = mongoose.Schema

type LaundryInvitationDefinition = {
  email: string,
  used: boolean,
  laundry: ObjectId
}

const laundryInvitationSchema: Schema<LaundryInvitationDefinition> = new Schema({
  email: {type: String, required: true},
  used: {type: Boolean, default: false},
  laundry: {type: Schema.Types.ObjectId, ref: 'Laundry', required: true}
}, {timestamps: true})

laundryInvitationSchema.index({email: 1})

export default mongoose.model('LaundryInvitation', laundryInvitationSchema)
