// @flow
import config from 'config'
import {opbeat} from '../opbeat'

export function logError (err: ?Error): void {
  if (!err) return
  if (config.get('logging.error.enabled')) console.error(err)
  if (opbeat) opbeat.captureError(err)
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
