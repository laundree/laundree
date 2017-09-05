// @flow
import mongoose from 'mongoose'
import type {ObjectId} from 'mongoose'
const {Schema} = mongoose

export type BookingDefinition = {
  docVersion: number,
  from: Date,
  to: Date,
  oneSignalId?: string,
  owner: ObjectId,
  machine: ObjectId,
  laundry: ObjectId
}

const bookingSchema: Schema<BookingDefinition> = new Schema({
  docVersion: {type: Number},
  from: {type: Date, required: true},
  to: {type: Date, required: true},
  oneSignalId: String,
  owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  machine: {type: Schema.Types.ObjectId, ref: 'Machine', required: true},
  laundry: {type: Schema.Types.ObjectId, ref: 'Laundry', required: true}
}, {timestamps: true})

bookingSchema.index({'from': 1})
bookingSchema.index({'to': 1})

export default mongoose.model('Booking', bookingSchema)
