/**
 * Created by budde on 28/04/16.
 */
var mongoose = require('mongoose')

function mongooseClearDb () {
  return new Promise((resolve, reject) => {
    mongoose.connection.db.dropDatabase((err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

module.exports.clearDb = mongooseClearDb
