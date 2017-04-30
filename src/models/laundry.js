/**
 * Created by budde on 02/06/16.
 */
const mongoose = require('mongoose')
const {Schema} = mongoose

const laundrySchema = new Schema({
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
}, {timestamps: true})

laundrySchema.index({'name': 1})
laundrySchema.index({'users': 1})

const LaundryModel = mongoose.model('Laundry', laundrySchema)

module.exports = LaundryModel
