// @flow

import Debug from 'debug'

const debug = Debug('laundree.client,store')

class LocalStore<V> {
  key: string

  constructor (key: string) {
    this.key = key
  }

  set (value: V) {
    window.localStorage.setItem(this.key, JSON.stringify(value))
  }

  del () {
    window.localStorage.removeItem(this.key)
  }

  get (): ?V {
    try {
      return JSON.parse(window.localStorage.getItem(this.key)) || null
    } catch (err) {
      debug(`Failed to parse item ${this.key}`)
      return null
    }
  }
}

export const signUpStore: LocalStore<{ laundryId: string, key: string, userId: string }> = new LocalStore('laundry.signup')
