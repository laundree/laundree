// @flow
import { StatusError, logError } from '../utils/error'
import type { Response, Request, ParsedParams } from './types'
import { parseParams } from './types'
import UserHandler from '../handlers/user'
import LaundryHandler from '../handlers/laundry'
import TokenHandler from '../handlers/token'
import InviteHandler from '../handlers/laundry_invitation'
import BookingHandler from '../handlers/booking'
import MachineHandler from '../handlers/machine'
import type {ApiResult, Summary} from 'laundree-sdk/lib/sdk'
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
  machine: ?MachineHandler,
  currentUser: ?UserHandler
}

type Handler = UserHandler | LaundryHandler | TokenHandler | MachineHandler | BookingHandler | InviteHandler

async function pullSubject<H: Handler> (id: string, _Handler: Class<H>): Promise<H> {
  const instance = await _Handler.lib.findFromId(id)
  if (!instance) throw new StatusError('Not found', 404)
  return instance
}

async function pullSubjects (params: ParsedParams, req: Request): Promise<Subjects> {
  const currentUserId = (req.jwt && req.jwt.userId) || null
  const currentUser = await (currentUserId && UserHandler.lib.findFromId(currentUserId))
  const [user, machine, token, invite, laundry, booking] = await Promise.all([
    params.userId ? pullSubject(params.userId, UserHandler) : null,
    params.machineId ? pullSubject(params.machineId, MachineHandler) : null,
    params.tokenId ? pullSubject(params.tokenId, TokenHandler) : null,
    params.inviteId ? pullSubject(params.inviteId, InviteHandler) : null,
    params.laundryId ? pullSubject(params.laundryId, LaundryHandler) : null,
    params.bookingId ? pullSubject(params.bookingId, BookingHandler) : null
  ])
  const fetcherCandidate = machine || invite || booking
  const newLaundry = (laundry || !fetcherCandidate ? laundry : await fetcherCandidate.fetchLaundry())
  return {user, machine, token, invite, laundry: newLaundry, booking, currentUser}
}

function testUserAccess (subjects: Subjects): UserHandler {
  if (!subjects.currentUser) {
    throw new StatusError('Invalid credentials', 403)
  }
  return subjects.currentUser
}

export function securityUserAccess (subjects: Subjects): void {
  testUserAccess(subjects)
}

export function securityWebApplication () {
  // TODO implement
}

export function securitySelf (subjects: Subjects): void {
  const currentUser = testUserAccess(subjects)
  if (!subjects.user || currentUser.model.id !== subjects.user.model.id) {
    throw new StatusError('Not allowed', 403)
  }
}

export function securityTokenOwner (subjects: Subjects): void {
  const currentUser = testUserAccess(subjects)
  if (subjects.token && subjects.token.isOwner(currentUser)) {
    return
  }
  throw new StatusError('Not found', 404)
}

export function securityLaundryOwner (subjects: Subjects, req: Request): void {
  const currentUser = testUserAccess(subjects)
  if (subjects.laundry && subjects.laundry.isOwner(currentUser)) {
    return
  }
  throw new StatusError('Not allowed', 403)
}

export function securityLaundryUser (subjects: Subjects, req: Request): void {
  const currentUser = testUserAccess(subjects)
  if (subjects.laundry && subjects.laundry.isUser(currentUser)) {
    return
  }
  throw new StatusError('Not found', 404)
}

export function securityBookingCreator (subjects: Subjects, req: Request): void {
  const currentUser = testUserAccess(subjects)
  if (subjects.booking && subjects.booking.isOwner(currentUser)) {
    return
  }
  throw new StatusError('Not found', 404)
}

export function securityAdministrator (subjects: Subjects, req: Request): void {
  const currentUser = testUserAccess(subjects)
  if (!currentUser.isAdmin()) {
    throw new StatusError('Not allowed', 403)
  }
}

export function securityNoop (subjects: Subjects, req: Request): void {
}

type Security = (s: Subjects, r: Request) => void

function buildSecurityFunction (securities: Security[]): (params: ParsedParams, req: Request) => Promise<Subjects> {
  return async (params: ParsedParams, req: Request) => {
    const subjects: Subjects = await pullSubjects(params, req)
    let firstError
    for (const security of securities) {
      try {
        security(subjects, req)
        return subjects
      } catch (err) {
        if (firstError) continue
        firstError = err
      }
    }
    throw firstError || new Error('No security defined!')
  }
}

type Middleware = (subjects: Subjects, p: ParsedParams, req: Request, res: Response) => Promise<?ApiResult>

export function wrap (func: Middleware, security: Security, ...securities: Security[]): (req: Request, res: Response) => * {
  const securityFunction = buildSecurityFunction([security].concat(securities))
  return (req: Request, res: Response) => {
    const params: ParsedParams = parseParams(req.swagger.params)
    securityFunction(params, req)
      .then((subjects) => func(subjects, params, req, res))
      .then(result => returnSuccess(res, result))
      .catch(err => {
        const status = err.status || 500
        if (status === 500) logError(err)
        res.status(status)
        res.json({message: err.message})
      })
  }
}

type PaginateFunction = (since: ?string, pageSize: number, subjects: Subjects, p: ParsedParams, req: Request, res: Response) => Promise<{summaries: Summary[], linkBase: string}>

function buildQs (vars) {
  const qs = Object.keys(vars).reduce((acc, k) => vars[k] === undefined ? acc : `&${acc}=${encodeURIComponent(vars[k])}`, '')
  return qs && qs.substr(1)
}

export function paginate (p: PaginateFunction): Middleware {
  return async (subjects: Subjects, params: ParsedParams, req, res) => {
    const {pageSize} = assertSubjects({pageSize: params.page_size})
    const {summaries, linkBase} = await p(params.since || null, pageSize, subjects, params, req, res)
    const links: { first: string, next?: string } = {
      first: `${linkBase}?${buildQs({...req.query, since: undefined, page_size: pageSize})}`
    }
    if (summaries.length) {
      links.next = `${linkBase}?${buildQs({...req.query, since: summaries[summaries.length - 1], page_size: pageSize})}`
    }
    res.links(links)
    return summaries
  }
}

export function assert<V> (v: ?V): V {
  if (!v) throw new Error('Failed assertion')
  return v
}

type Exporter = <A>(?A) => A

export function assertSubjects<O: {}> (o: O): $ObjMap<O, Exporter> {
  return Object.keys(o).reduce((acc, key) => {
    const a = o[key]
    if (a === null) {
      throw new Error(`Failed assertion. ${key} not available`)
    }
    return {...acc, [key]: a}
  }, {})
}
