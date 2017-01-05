/**
 * Created by budde on 27/04/16.
 */
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const laundryInvitationSchema = new Schema({
  email: {type: String, required: true},
  used: {type: Boolean, default: false},
  laundry: {type: Schema.Types.ObjectId, ref: 'Laundry', required: true}
}, {timestamps: true})

laundryInvitationSchema.index({email: 1})

const LaundryInvitationModel = mongoose.model('LaundryInvitation', laundryInvitationSchema)

module.exports = LaundryInvitationModel
