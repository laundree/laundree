// @flow

import { Handler, Library } from './handler'
import type { updateAction } from './handler'
import type { TokenHandler } from './token'
import type { EventDocument } from '../flowModels/event'
import type { UserDocument, Profile } from '../flowModels/user'
import { UserModel } from '../flowModels/user'
import config from 'config'
const debug = require('debug')('laundree.handlers.event')

export class UserHandler extends Handler<UserHandler, UserDocument> {
  static updateActions: updateAction<UserHandler>[] = []

  constructor (doc: EventDocument) {
    super(doc, UserHandler.updateActions)
  }

  isDemo () {
    return Boolean(this.doc.demo)
  }

  findPhoto (): ?string {
    const profile = this.doc.latestProfile
    const photo = profile.photos && profile.photos.length && profile.photos[0].value
    if (!photo) return null
    if (profile.provider !== 'google') return photo || null
    const matches = photo.match(/sz=([0-9]+)$/)
    if (!matches) {
      return photo
    }
    return photo.substr(0, photo.length - matches[1].length) + '200'
  }

  handler () {
    return this
  }

  buildReduxModel (): {
    id: string,
    photo: ?string,
    displayName: string,
    laundries: string[],
    lastSeen: ?string,
    role: string,
    demo: boolean
  } {
    return {
      id: this.doc.id,
      photo: this.findPhoto(),
      displayName: this.doc.displayName,
      laundries: this.doc.laundries.map(id => id.toString()),
      lastSeen: this.doc.lastSeen && this.doc.lastSeen.toISOString(),
      role: this.doc.role,
      demo: this.isDemo()
    }
  }

  updateProfile (profile: Profile) {

  }
}

export class UserLibrary extends Library {
  async findFromEmail (email: string): Promise<?UserHandler> {
    const doc = await UserModel
      .findOne({'profiles.emails.value': email.toLowerCase().trim()})
      .exec()
    if (!doc) {
      return null
    }
    return new UserHandler(doc).updateDocument()
  }

  async findOrCreateFromProfile (profile: Profile): Promise<?UserHandler> {
    if (!profile.emails || !profile.emails.length) {
      return null
    }
    const email = profile.emails[0].value
    if (!email) {
      return null
    }
    const user = await this
      .findFromEmail(email)
    if (user) {
      return user.updateProfile(profile)
    }
    return this.createUserFromProfile(profile)
  }

  async findFromIdWithTokenSecret (userId: string, secret: string): Promise<{ user?: UserHandler, token?: TokenHandler }> {
    const user = await this.findFromId(userId)
    if (!user) return {}
    const token = await user.findAuthTokenFromSecret(secret)
    return token ? {user, token} : {}
  }

  createUserFromProfile (profile: Profile) {
    if (!profile.emails || !profile.emails.length) return Promise.resolve()
    const role = profile.emails
        .reduce((role, {value}) => role || config.get('defaultUsers')[value], null) || 'user'
    return new UserModel({
      calendarTokensReferences: [],
      explicitVerifiedEmails: [],
      pendingExplicitEmailVerifications: [],
      laundries: [],
      authTokens: [],
      docVersion: 1,
      profiles: [Object.assign({}, profile, {
        emails: profile.emails
          .map(({value, type}) => ({value: value && value.toLowerCase(), type}))
      })],
      latestProvider: profile.provider,
      role
    }).save()
      .then((model) => new UserHandler(model))
      .then((user) => {
        user.emitEvent('create')
        return user.addLaundriesFromInvites().then(() => user)
      })
  }

}
