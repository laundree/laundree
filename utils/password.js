// @flow
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import config from 'config'
import { encode } from 'base64url'

function hashPassword (password: string, saltRounds: number = config.get('security.password.saltRounds')): Promise<string> {
  return new Promise((resolve, reject) => bcrypt
    .genSalt(saltRounds, (err, salt) => {
      if (err) {
        return reject(err)
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) return reject(err)
        resolve(hash)
      })
    }))
}

function comparePassword (password: string, hash: string): Promise<bool> {
  return new Promise((resolve, reject) => bcrypt.compare(password, hash, (err, res) => {
    if (err) {
      return reject(err)
    }
    resolve(res)
  }))
}

function generateToken (): Promise<string> {
  return new Promise((resolve, reject) => crypto.randomBytes(20, (err, buffer) => {
    if (err) return reject(err)
    resolve(buffer.toString('hex'))
  }))
}

function generateBase64UrlSafeCode (entropy: number = 6): Promise<string> {
  return new Promise((resolve, reject) => crypto.randomBytes(entropy, (err, buffer) => {
    if (err) return reject(err)
    return resolve(encode(buffer))
  }))
}

async function generateTokenAndHash (): Promise<{ token: string, hash: string }> {
  const token = await generateToken()
  const hash = await hashPassword(token)
  return {hash, token}
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateTokenAndHash,
  generateBase64UrlSafeCode
}
