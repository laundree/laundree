/**
 * Created by budde on 06/05/16.
 */
var bcrypt = require('bcrypt')

/**
 * Hash a given password
 * @param {int} saltRounds
 * @param {string} password
 * @return {Promise.<string>}
 */
function hashPassword (saltRounds, password) {
  return new Promise((resolve, reject) => bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) return reject(err)
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) return reject(err)
      resolve(hash)
    })
  }))
}

function comparePassword (password, hash) {
  return new Promise((resolve, reject) => bcrypt.compare(password, hash, (err, res) => {
    if (err) return reject(err)
    resolve(res)
  }))
}

module.exports = {
  hashPassword: hashPassword,
  comparePassword: comparePassword
}
