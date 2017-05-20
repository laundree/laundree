// @flow

import { Handler, HandlerLibrary } from './handler'
import { password } from '../utils'
import TokenModel from '../models/token'
import type { TokenType } from '../models/token'
import UserHandler from './user'
import type { QueryConditions } from 'mongoose'

class TokenHandlerLibrary extends HandlerLibrary {
  constructor () {
    super(TokenHandler, TokenModel)
  }

  async findTokenFromSecret (secret: string, filter: QueryConditions) {
    switch (secret.substring(0, 2)) {
      case 'v2':
        const [, id, sec] = secret.split('.')
        const [token] = await this
          .find({$and: [{_id: id}, filter]})
        if (!token) return null
        const result = await token.verify(sec)
        if (!result) return null
        return token
      default:
        const tokens = await this.find(filter)
        const validTokens = await Promise
          .all(tokens.map(async token => {
            const result = await token.verify(secret)
            return result && token
          }))
        return validTokens.find(t => t) || null
    }
  }

  /**
   * Create a new token with given owner and name
   * @param {UserHandler} owner
   * @param {string} name
   * @param {string} type
   * @return {Promise.<TokenHandler>}
   */
  async _createToken (owner: UserHandler, name: string, type: TokenType) {
    const token = await password.generateToken()
    const hash = await password.hashPassword(token)
    const model = await new TokenModel({
      name,
      type,
      hash,
      owner: owner.model.id
    })
      .save()
    return new TokenHandler(model, token)
  }

}

export default class TokenHandler extends Handler<TokenModel, *> {
  static lib = new TokenHandlerLibrary()
  lib = TokenHandler.lib
  secret: ?string
  restUrl: string

  constructor (model: TokenModel, secret?: string) {
    super(model)
    this.secret = secret ? `v2.${this.model.id}.${secret}` : null
    this.restUrl = `/api/tokens/${this.model.id}`
  }

  async seen () {
    this.model.lastSeen = new Date()
    this.model = await this.model.save()
    return this
  }

  /**
   * Verify given secret against hash
   * @param secret
   * @returns {Promise.<boolean>}
   */
  verify (secret: string) {
    const version = secret.substring(0, 2)
    switch (version) {
      case 'v2':
        const prefix = `v2.${this.model.id}.`
        if (!secret.startsWith(prefix)) {
          return Promise.resolve(false)
        }
        return password.comparePassword(secret.substr(prefix.length), this.model.hash)
      default:
        return password.comparePassword(secret, this.model.hash)
    }
  }

  /**
   * Delete the token
   * @return {Promise.<TokenHandler>}
   */
  async deleteToken () {
    await this.model.remove()
    return this
  }

  /**
   * @param {UserHandler} user
   * @return {boolean}
   */
  isOwner (user: UserHandler) {
    const ownerId = this.model.owner
    return user.model._id.equals(ownerId)
  }

  fetchOwner () {
    return UserHandler.lib.findFromId(this.model._id)
  }

  async toRest () {
    const owner = await this.fetchOwner()
    return {
      id: this.model.id,
      name: this.model.name,
      owner: owner.toRestSummary(),
      href: this.restUrl,
      secret: undefined
    }
  }

  async toSecretRest () {
    const obj = await this.toRest()
    obj.secret = this.secret
    return obj
  }

  toRestSummary () {
    return {id: this.model.id, name: this.model.name, href: this.restUrl}
  }
}
