// @flow
import * as error from './error'
import type {Response, Request} from '../types'

export function generateErrorHandler (res: Response) {
  return (err: Error) => {
    error.logError(err)
    res.status(500)
    res.json({message: 'Internal server error'})
  }
}

/**
 * Return an error.
 * @param res
 * @param {number} statusCode
 * @param {string} message
 * @param {Object=} headers
 */
export function returnError (res: Response, statusCode: number, message: string, headers: { [string]: string } = {}) {
  res.status(statusCode)
  Object.keys(headers).forEach((header) => res.set(header, headers[header]))
  res.json({message: message})
}

/**
 * Return success
 * @param res
 * @param {(Promise|Object)=} result
 * @returns {number|*}
 */
export function returnSuccess<X> (res: Response, result: Promise<X> | X) {
  res.status(result ? 200 : 204)
  if (!result) return res.end()
  Promise.resolve(result)
    .then(result => res.json(result))
    .catch(error.logError)
}

export function wrapErrorHandler<A: Request, B: Response, C> (func: (req: A, res: B) => Promise<C> | C) {
  return (req: A, res: B) => {
    return Promise
      .resolve(func(req, res))
      .catch(generateErrorHandler(res))
  }
}
