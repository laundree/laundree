/**
 * Created by budde on 27/04/16.
 */
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var laundryInvitationSchema = new Schema({
  email: {type: String, required: true},
  laundry: {type: Schema.Types.ObjectId, ref: 'Laundry', required: true}
}, {timestamps: true})

laundryInvitationSchema.index({email: 1})

/**
 * Find from id string
 * @param {string} id
 */
laundryInvitationSchema.statics.findFromId = (id) => LaundryInvitationModel.findById(new mongoose.Types.ObjectId(id))

const LaundryInvitationModel = mongoose.model('LaundryInvitation', laundryInvitationSchema)

module.exports = LaundryInvitationModel
