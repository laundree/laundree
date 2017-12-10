// @flow
import mongoose from 'mongoose'
import type { ObjectId } from 'mongoose'

const {Schema} = mongoose

export type MachineType = 'wash' | 'dry'

type MachineDescription = {
  name: string,
  type: MachineType,
  laundry: ObjectId,
  broken: boolean
}

const machineSchema: Schema<MachineDescription> = new Schema({
  name: {type: String, required: true},
  type: {type: String, enum: ['wash', 'dry'], required: true},
  laundry: {type: Schema.Types.ObjectId, ref: 'Laundry', required: true},
  broken: {type: Boolean, required: true, default: false}
}, {timestamps: true, usePushEach: true})

machineSchema.index({name: 1, laundry: 1}, {unique: true})
machineSchema.index({'from': 1})
machineSchema.index({'to': 1})

export default mongoose.model('Machine', machineSchema)
