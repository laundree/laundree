/**
 * Created by budde on 06/05/16.
 */
var bcrypt = require('bcrypt')
var crypto = require('crypto')
var config = require('config')
const Promise = require('promise')

/**
 * Hash a given password
 * @param {int=} saltRounds
 * @param {string} password
 * @return {Promise.<string>}
 */
function hashPassword (password, saltRounds) {
  saltRounds = saltRounds || config.get('security.password.saltRounds')
  return new Promise((resolve, reject) => bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) return reject(err)
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) return reject(err)
      resolve(hash)
    })
  }))
}

/**
 * @param {string} password
 * @param {string} hash
 * @returns {Promise.<boolean>}
 */
function comparePassword (password, hash) {
  return new Promise((resolve, reject) => bcrypt.compare(password, hash, (err, res) => {
    if (err) return reject(err)
    resolve(res)
  }))
}

/**
 * @return {Promise.<string>}
 */
function generateToken () {
  return new Promise((resolve, reject) => crypto.randomBytes(20, (err, buffer) => {
    if (err) return reject(err)
    resolve(buffer.toString('hex'))
  }))
}

module.exports = {
  hashPassword: hashPassword,
  comparePassword: comparePassword,
  generateToken: generateToken
}
