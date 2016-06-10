/**
 * Created by budde on 27/04/16.
 */
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var tokenSchema = new Schema({
  name: {type: String, required: true, trim: true},
  hash: {type: String},
  owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  lastSeen: Date
}, {timestamps: true})

tokenSchema.index({name: 1, owner: 1}, {unique: true})

tokenSchema.index({'name': 1})

/**
 * Find from id string
 * @param {string} id
 */
tokenSchema.statics.findFromId = (id) => TokenModel.findById(new mongoose.Types.ObjectId(id))

const TokenModel = mongoose.model('Token', tokenSchema)

module.exports = TokenModel
