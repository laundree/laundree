const mongoose = require('mongoose')
const {Schema} = mongoose

const eventSchema = new Schema({
  model: {type: String, required: true},
  reference: {type: Schema.Types.ObjectId, required: true},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  type: {type: String, required: true},
  data: {type: Schema.Types.Mixed}
}, {timestamps: true})

eventSchema.index({reference: 1})
eventSchema.index({createdAt: 1})

const EventModel = mongoose.model('Event', eventSchema)

module.exports = EventModel
