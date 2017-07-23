// @flow

import { Sdk } from 'laundree-sdk'
import { signAppToken } from '../auth'

let tokenCache: ?{token: string, cacheTime: number} = null

const authenticator = async () => {
  if (tokenCache && tokenCache.cacheTime + 60 * 60 * 1000 < Date.now()) {
    return {type: 'bearer', token: tokenCache.token}
  }
  tokenCache = {token: await signAppToken('https://web.laundree.io', 'https://api.laundree.io'), cacheTime: Date.now()}
  return {type: 'bearer', token: tokenCache.token}
}

const s: Sdk = new Sdk('/api', authenticator) // TODO make api address configurable
export default s
