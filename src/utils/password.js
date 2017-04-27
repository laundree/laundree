/**
 * Created by budde on 06/05/16.
 */
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const config = require('config')

const base64UrlSafe = require('urlsafe-base64')

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

/**
 * Create new code
 * @param {int=6} entropy
 * @returns {Promise.<string>}
 */
function generateBase64UrlSafeCode (entropy = 6) {
  return new Promise((resolve, reject) => crypto.randomBytes(entropy, (err, buffer) => {
    if (err) return reject(err)
    return resolve(base64UrlSafe.encode(buffer))
  }))
}

/**
 * Generate a token and hash
 * @returns {Promise.<{token: string, hash: string}>}
 */
function generateTokenAndHash () {
  return generateToken().then(token => hashPassword(token).then(hash => ({hash, token})))
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateTokenAndHash,
  generateBase64UrlSafeCode
}
