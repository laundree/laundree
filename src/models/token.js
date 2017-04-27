/**
 * Created by budde on 27/04/16.
 */
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tokenSchema = new Schema({
  name: {type: String, required: true, trim: true},
  hash: {type: String},
  type: {type: String, enum: ['auth', 'calendar', 'reset', 'verification'], default: 'auth'},
  owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  lastSeen: Date
}, {timestamps: true})

tokenSchema.index({name: 1, owner: 1}, {unique: true})

tokenSchema.index({'name': 1})

const TokenModel = mongoose.model('Token', tokenSchema)

module.exports = TokenModel
