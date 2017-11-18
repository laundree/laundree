// @flow

import s from './sdk'
import app from './app'
import Debug from 'debug'

const debug = Debug('laundree.client')

debug('┬┴┬┴┤ ͜ʖ ͡°) ├┬┴┬┴')

app()

class LocalStore<V> {
  key: string

  constructor (key: string) {
    this.key = key
  }

  set (value: V) {
    window.localStorage.setItem(this.key, JSON.stringify(value))
  }

  get (): ?V {
    try {
      return JSON.parse(window.localStore.getItem(this.key)) || null
    } catch (err) {
      debug(`Failed to parse item ${this.key}`)
      return null
    }
  }
}

export const signUpStore: LocalStore<{ laundryId: string, key: string, email: string }> = new LocalStore('laundry.signup')

export const sdk = s
