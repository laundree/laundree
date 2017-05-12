// @flow

import mongoose from 'mongoose'
import type { ObjectId } from 'mongoose'
const {Schema} = mongoose

type Definition = {
  docVersion: number,
  from: Date,
  to: Date,
  oneSignalId: ?string,
  owner: ObjectId,
  machine: ObjectId,
  laundry: ObjectId
}

const bookingSchema: Schema<Definition> = new Schema({
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

const BookingModel = mongoose.model('Booking', bookingSchema)

export default BookingModel
