// @flow

import crypto from 'crypto'

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
