// @flow
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import config from 'config'
import base64UrlSafe from 'urlsafe-base64'

/**
 * Hash a given password
 * @param {int=} saltRounds
 * @param {string} password
 * @return {Promise.<string>}
 */
export function hashPassword (password: string, saltRounds?: number): Promise<string> {
  const certainSaltRounds: number = saltRounds || config.get('security.password.saltRounds')
  return new Promise((resolve, reject) => bcrypt.genSalt(certainSaltRounds, (err, salt) => {
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
export function comparePassword (password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => bcrypt.compare(password, hash, (err, res) => {
    if (err) return reject(err)
    resolve(res)
  }))
}

/**
 * @return {Promise.<string>}
 */
export function generateToken (): Promise<string> {
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
export function generateBase64UrlSafeCode (entropy: number = 6): Promise<string> {
  return new Promise((resolve, reject) => crypto.randomBytes(entropy, (err, buffer) => {
    if (err) return reject(err)
    return resolve(base64UrlSafe.encode(buffer))
  }))
}

/**
 * Generate a token and hash
 * @returns {Promise.<{token: string, hash: string}>}
 */
export function generateTokenAndHash (): Promise<{token: string, hash: string}> {
  return generateToken().then(token => hashPassword(token).then(hash => ({hash, token})))
}
