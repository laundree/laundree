// @flow

import { Sdk } from 'laundree-sdk'
import { signAppToken } from '../auth'
import config from 'config'

let tokenCache: ?{token: string, cacheTime: number} = null

const authenticator = async () => {
  if (tokenCache && tokenCache.cacheTime + 60 * 60 * 1000 < Date.now()) {
    return {type: 'bearer', token: tokenCache.token}
  }
  tokenCache = {token: await signAppToken('https://web.laundree.io', 'https://api.laundree.io', Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60), cacheTime: Date.now()}
  return {type: 'bearer', token: tokenCache.token}
}

const s: Sdk = new Sdk(config.get('api.base'), authenticator) // TODO make api address configurable
export default s
