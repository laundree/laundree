const mongoose = require('mongoose')
const {Schema} = mongoose

const eventSchema = new Schema({
  model: {type: String, required: true},
  reference: {type: Schema.Types.ObjectId, required: true},
  type: {type: String, required: true}
}, {timestamps: true})

eventSchema.index({reference: 1})
eventSchema.index({createdAt: 1})

const EventModel = mongoose.model('Event', eventSchema)

module.exports = EventModel
