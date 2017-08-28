// @flow

import crypto from 'crypto'
import base64UrlSafe from 'urlsafe-base64'

/**
 * Returns corresponding short name
 */
export function shortName (name: string) {
  return (name
    .toLocaleLowerCase()
    .trim()
    .match(/(^(.)| ([^\s])|[0-9])/g) || [])
    .map((m) => m.trim()).join('').toLocaleUpperCase()
}

export function hash (str: string): string {
  return crypto.createHash('md5').update(str).digest('hex')
}

export function shortIdToLong (shortId: string): string {
  return base64UrlSafe.decode(shortId).toString('hex')
}

export function longIdToShort (longId: string): string {
  return base64UrlSafe.encode(Buffer.from(longId, 'hex'))
}
