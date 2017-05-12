
import Handler from './handler'
import password from '../utils/password'
import TokenModel from '../models/token'

class TokenHandler extends Handler {
  constructor (model: TokenModel, secret: string) {
    super(model)
    this.secret = secret
  }

  static find (filter, options) {
    return this._find(TokenModel, TokenHandler, filter, options)
  }

  static findFromId (id) {
    return this._findFromId(TokenModel, TokenHandler, id)
  }

  static findTokenFromSecret (secret, filter) {
    switch (secret.substring(0, 2)) {
      case 'v2':
        const [, id, sec] = secret.split('.')
        return TokenHandler
          .find({$and: [{_id: id}, filter]})
          .then(([token]) => {
            if (!token) return null
            return token.verify(sec).then(result => result
              ? token
              : null)
          })
      default:
        return TokenHandler.find(filter)
          .then(tokens => Promise
            .all(tokens.map(token => token.verify(secret).then(result => result && token)))
            .then(tokens => tokens.find(t => t) || null))
    }
  }

  /**
   * Create a new token with given owner and name
   * @param {UserHandler} owner
   * @param {string} name
   * @param {string} type
   * @return {Promise.<TokenHandler>}
   */
  static _createToken (owner, name, type) {
    return password.generateToken()
      .then(token => password
        .hashPassword(token)
        .then(hash => new TokenModel({
          name,
          type,
          hash,
          owner: owner.model.id
        })
          .save()
          .then(model => new TokenHandler(model, token))))
  }

  seen () {
    this.model.lastSeen = new Date()
    return this.model.save().then((model) => {
      this.model = model
      return this
    })
  }

  /**
   * @return {string}
   */
  get secret () {
    return `v2.${this.model.id}.${this._secret}`
  }

  /**
   * Verify given secret against hash
   * @param secret
   * @returns {Promise.<boolean>}
   */
  verify (secret) {
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
  deleteToken () {
    return this.model.remove().then(() => this)
  }

  /**
   * @param {UserHandler} user
   * @return {boolean}
   */
  isOwner (user) {
    const ownerId = this.model.populated('owner') || this.model.owner
    return user.model._id.equals(ownerId)
  }

  get restUrl () {
    return `/api/tokens/${this.model.id}`
  }

  toRest () {
    const UserHandler = require('./user')
    return TokenModel.populate(this.model, {path: 'owner', model: 'User'})
      .then((model) => ({
        id: model.id,
        name: model.name,
        owner: new UserHandler(model.owner).toRestSummary(),
        href: this.restUrl
      }))
  }

  toSecretRest () {
    return this
      .toRest()
      .then(o => {
        o.secret = this.secret
        return o
      })
  }

  toRestSummary () {
    return {id: this.model.id, name: this.model.name, href: this.restUrl}
  }
}

module.exports = TokenHandler
