// @flow

import { Handler, Library } from './handler'
import type { TokenDocument } from '../flowModels/token'
const debug = require('debug')('laundree.handlers.token')
import { comparePassword } from '../utils/password'

export class TokenHandler extends Handler<EventHandler, TokenDocument> {
  static updateActions = []

  constructor (doc: TokenDocument) {
    super(doc, TokenHandler.updateActions)
  }

  buildReduxModel (): { type: string, model: string, reference: string, createdAt: string } {
    return {
      type: this.doc.type,
      model: this.doc.model,
      reference: this.doc.reference,
      createdAt: this.doc.createdAt.toISOString()
    }
  }

  async verify (secret: string): Promise<bool> {
    const version = secret.substring(0, 2)
    switch (version) {
      case 'v2':
        const prefix = `v2.${this.doc.id}.`
        if (!secret.startsWith(prefix)) {
          return false
        }
        return comparePassword(secret.substr(prefix.length), this.doc.hash)
      default:
        return comparePassword(secret, this.doc.hash)
    }
  }

}

export class TokenLibrary extends Library<TokenHandler, TokenDocument> {

  async findTokenFromSecret (secret: string, filter: {}): Promise<?TokenHandler> {
    switch (secret.substring(0, 2)) {
      case 'v2':
        const [, id, sec] = secret.split('.')
        const [token] = await this.find({$and: [{_id: id}, filter]})
        if (!token) {
          return null
        }
        const result = await token.verify(sec)
        return result
          ? token
          : null
      default:
        const tokens = await this.find(filter)
        const verifiedTokens = await Promise
          .all(tokens.map(async token => {
            const result = await token.verify(secret)
            return result && token
          }))
        return verifiedTokens.find(t => t) || null
    }
  }

}
