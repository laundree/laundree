// @flow

import { Sdk } from 'laundree-sdk'
import { signAppToken } from '../auth'
import config from 'config'
import Debug from 'debug'

const debug = Debug('laundree.web.sdk')

let tokenCache: ?{token: string, cacheTime: number} = null

const authenticator = async () => {
  debug('Authenticating')
  if (tokenCache && (tokenCache.cacheTime + 60 * 60 * 1000) > Date.now()) {
    debug('Fetching token from cache')
    return {type: 'bearer', token: tokenCache.token}
  }
  debug('Generating new token')
  tokenCache = {token: await signAppToken('https://web.laundree.io', 'https://api.laundree.io'), cacheTime: Date.now()}
  return {type: 'bearer', token: tokenCache.token}
}

const s: Sdk = new Sdk(config.get('api.base'), authenticator)
export default s
