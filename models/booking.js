/**
 * Created by budde on 09/06/16.
 */

const mongoose = require('mongoose')
const {Schema} = mongoose

const bookingSchema = new Schema({
  docVersion: {type: Number},
  from: {type: Date, required: true},
  to: {type: Date, required: true},
  owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  machine: {type: Schema.Types.ObjectId, ref: 'Machine', required: true},
  laundry: {type: Schema.Types.ObjectId, ref: 'Laundry', required: true}
}, {timestamps: true})

bookingSchema.index({'from': 1})
bookingSchema.index({'to': 1})

const BookingModel = mongoose.model('Booking', bookingSchema)

module.exports = BookingModel
