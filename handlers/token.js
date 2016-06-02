/**
 * Created by budde on 02/06/16.
 */

const Handler = require('./handler')
const {password} = require('../utils')
const {TokenModel} = require('../models')

class TokenHandler extends Handler {

  constructor (model, secret) {
    super(model)
    this.secret = secret
  }

  static find (filter, limit) {
    return TokenModel
      .find(filter, null, {sort: {'_id': 1}})
      .limit(limit || 10)
      .exec()
      .then((tokens) => tokens.map((model) => new TokenHandler(model)))
  }

  /**
   * Create a new token with given owner and name
   * @param {UserHandler} owner
   * @param {string} name
   * @return {Promise.<TokenHandler>}
   */
  static _createToken (owner, name) {
    return password.generateToken()
      .then((token) => Promise.all([token, password.hashPassword(token)]))
      .then((result) => {
        const [token, hash] = result
        return new TokenModel({
          name: name,
          hash: hash,
          owner: owner.model.id
        })
          .save()
          .then((model) => new TokenHandler(model, token))
      })
  }

  seen () {
    this.model.lastSeen = new Date()
    return this.model.save().then((model) => {
      this.model = model
      return this
    })
  }

  /**
   * Verify given secret against hash
   * @param secret
   * @returns {Promise.<boolean>}
   */
  verify (secret) {
    return password.comparePassword(secret, this.model.hash)
  }

  toRestSummary () {
    return {id: this.model.id, name: this.model.name, href: `/api/tokens/${this.model.id}`}
  }
}

module.exports = TokenHandler
