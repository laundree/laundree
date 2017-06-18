// @flow
import config from 'config'
import {opbeat} from '../lib/opbeat'

export function logError (err: ?Error): void{
  if (!err) return
  if (config.get('logging.error.enabled')) console.error(err)
  if (opbeat) opbeat.captureError(err)
}

export class StatusError extends Error {
  status: number
  constructor (msg: string, status: number) {
    super(msg)
    this.status = status
  }
}
