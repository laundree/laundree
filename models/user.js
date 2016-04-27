/**
 * Created by budde on 27/04/16.
 */
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var userSchema = new Schema({
  email: {type: String, required: true, trim: true, lowercase: true, unique: true},
  password: {type: String},
  profiles: [{
    provider: String,
    id: String,
    displayName: String,
    name: {
      familyName: String,
      givenName: String,
      middleName: String
    },
    emails: [{value: String, type: {type: String}}],
    photos: [{value: String}]
  }]
})

/**
 * Find from id string
 * @param {string} id
 */
userSchema.statics.findFromId = (id) => UserModel.findById(new mongoose.Types.ObjectId(id))

var UserModel = mongoose.model('User', userSchema)

module.exports = UserModel
