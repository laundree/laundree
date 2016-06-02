/**
 * Created by budde on 27/04/16.
 */
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var tokenSchema = new Schema({
  name: {type: String, required: true, trim: true},
  hash: {type: String},
  owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  lastSeen: Date,
  createdAt: {type: Date},
  updatedAt: {type: Date}
}, {
  toObject: {virtuals: true},
  toJSON: {virtuals: true}
})

tokenSchema.index({name: 1, owner: 1}, {unique: true})

tokenSchema.pre('save', function (next) {
  var now = new Date()
  this.updatedAt = now
  if (!this.createdAt) {
    this.createdAt = now
  }
  next()
})

tokenSchema.index({'name': 1})

const TokenModel = mongoose.model('Token', tokenSchema)
module.exports = TokenModel
