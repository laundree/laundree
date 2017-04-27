/**
 * Created by budde on 09/06/16.
 */

const mongoose = require('mongoose')
const {Schema} = mongoose

const machineSchema = new Schema({
  name: {type: String, required: true},
  type: {type: String, enum: ['wash', 'dry'], required: true},
  laundry: {type: Schema.Types.ObjectId, ref: 'Laundry', required: true},
  broken: {type: Boolean, required: true, default: false}
}, {timestamps: true})

machineSchema.index({name: 1, laundry: 1}, {unique: true})
machineSchema.index({'from': 1})
machineSchema.index({'to': 1})

const MachineModel = mongoose.model('Machine', machineSchema)

module.exports = MachineModel
