// @flow

import type { Document, Model } from './document'
import mongoose from 'mongoose'
const Schema = mongoose.Schema

type Field = mongoose$SchemaFieldDeclaration

export interface EventDocument extends Document {
  model: string,
  reference: string,
  user: ?mongoose$ObjectId,
  type: string,
  data: ?{},
  constructor(doc: EventDocument): EventDocument
}

const eventSchema = new Schema({
  model: ({type: Schema.Types.String, required: true}: Field),
  reference: ({type: Schema.Types.ObjectId, required: true}: Field),
  user: ({type: Schema.Types.ObjectId, ref: 'User'}: Field),
  type: ({type: Schema.Types.String, required: true}: Field),
  data: Schema.Types.Mixed
}, {timestamps: true})

eventSchema.index({reference: 1})
eventSchema.index({createdAt: 1})

export const EventModel: Class<EventDocument> = mongoose.model('Event', eventSchema)
