// @flow
import config from 'config'

export function logError (err: ?Error): void {
  if (!err) return
  if (config.get('logging.error.enabled')) console.error(err)
}

type HeaderName = 'Location'

export class StatusError extends Error {
  status: number
  headers: {[HeaderName]: string}

  constructor (msg: string, status: number, headers: {[HeaderName]: string} = {}) {
    super(msg)
    this.status = status
    this.headers = headers
  }
}
