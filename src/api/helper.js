// @flow
import { StatusError, logError } from '../utils/error'
import type { Response, Request } from './types'
import UserHandler from '../handlers/user'
import LaundryHandler from '../handlers/laundry'
import TokenHandler from '../handlers/token'
import InviteHandler from '../handlers/laundry_invitation'
import BookingHandler from '../handlers/booking'
import MachineHandler from '../handlers/machine'

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
async function returnSuccess<X> (res: Response, result: X): Promise<*> {
  res.status(result ? 200 : 204)
  if (!result) return res.end()
  res.json(result)
}

type Subjects = {
  user: ?UserHandler,
  laundry: ?LaundryHandler,
  token: ?TokenHandler,
  invite: ?InviteHandler,
  booking: ?BookingHandler,
  machine: ?MachineHandler
}

type Params = { userId?: string, machineId?: string, tokenId?: string, inviteId?: string, laundryId?: string, bookingId?: string }

type Middleware<C, S: Subjects, P: Params> = (subjects: S, p: P, req: Request, res: Response) => Promise<C>

type Handler = UserHandler | LaundryHandler | TokenHandler | MachineHandler | BookingHandler | InviteHandler

async function pullSubject<H: Handler> (id: string, _Handler: Class<H>): Promise<H> {
  const instance = await _Handler.lib.findFromId(id)
  if (!instance) throw new StatusError('Not found', 404)
  return instance
}

async function pullSubjects<P: Params> (params: P): Promise<Subjects> {
  const tp = {}
  if (params.userId) {
    tp.user = params.userId
  }
  const [user, machine, token, invite, laundry, booking] = await Promise.all([
    params.userId ? pullSubject(params.userId, UserHandler) : null,
    params.machineId ? pullSubject(params.machineId, MachineHandler) : null,
    params.tokenId ? pullSubject(params.tokenId, TokenHandler) : null,
    params.inviteId ? pullSubject(params.inviteId, InviteHandler) : null,
    params.laundryId ? pullSubject(params.laundryId, LaundryHandler) : null,
    params.bookingId ? pullSubject(params.bookingId, BookingHandler) : null
  ])
  return {user, machine, token, invite, laundry, booking}
}

export async function securityUserAccess (subjects: Subjects, req: Request): Promise<Subjects> {
  return subjects
}

export async function securitySelf<S: Subjects> (subjects: Subjects, req: Request): Promise<S> {
  return subjects
}

export async function securityTokenOwner (subjects: Subjects, req: Request): Promise<Subjects> {
  return subjects
}

export async function securityLaundryOwner (subjects: Subjects, req: Request): Promise<Subjects> {
  return subjects
}

export async function securityLaundryUser (subjects: Subjects, req: Request): Promise<Subjects> {
  return subjects
}

export async function securityBookingCreator (subjects: Subjects, req: Request): Promise<Subjects> {
  return subjects
}

export async function securityAdministrator<S: Subjects> (subjects: Subjects, req: Request): Promise<S> {
  return subjects
}

export async function securityNoop<S: Subjects> (subjects: Subjects, req: Request): Promise<S> {
  return subjects
}

type Security<S: Subjects> = (s: Subjects, r: Request) => Promise<S>

function buildSecurityFunction<S: Subjects, P: Params> (securities: Security<S>[]): (params: P, req: Request) => Promise<S> {
  return async (params: P, req: Request) => {
    const subjects: Subjects = await pullSubjects(params)
    let firstError
    for (const security of securities) {
      try {
        return await security(subjects, req)
      } catch (err) {
        if (firstError) continue
        firstError = err
      }
    }
    throw firstError || new Error('No security defined!')
  }
}

function parseParams<P: Params> (req: Request): P {
  const params = req.swagger
  return Object.keys(params).reduce((o, key) => ({[key]: params[key].value}), {})
}

export function wrap<C, S1: Subjects, S2: Subjects, P: Params> (func: Middleware<C, S, P>, security: Security<S>, ...securities: Security<S>[]): (req: Request, res: Response) => * {
  const securityFunction = buildSecurityFunction([security].concat(securities))
  return (req: Request, res: Response) => {
    const params = parseParams(req)
    securityFunction(params, req)
      .then((subjects: S) => func(subjects, params, req, res))
      .then(result => returnSuccess(res, result))
      .catch(err => {
        const status = err.status || 500
        if (status === 500) logError(err)
        res.status(status)
        res.json({message: err.message})
      })
  }
}

export function assert<V> (v: ?V): V {
  if (!v) throw new Error('Failed assertion')
  return v
}
