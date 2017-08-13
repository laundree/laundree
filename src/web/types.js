// @flow
import type { Request as Req, Response as Res, Application as App, Router as R } from 'express'
import type { LocaleType } from '../locales/index'
import type { FlashType } from '../utils/flash'
import type { User } from 'laundree-sdk/lib/sdk'

type WebRequestAddendum = {
  locale?: LocaleType,
  user?: User,
  session: {
    token?: string,
    to?: string,
    errorTo?: string,
    locale?: LocaleType
  },
  logout: () => void,
  flash: (type: 'success' | 'error', type: ?FlashType) => string[]
}

type WebResponseAddendum = {
  renderHb: (file: string, options: Object) => Promise<void>
}

export type Request = Req<WebRequestAddendum, WebResponseAddendum> & WebRequestAddendum

export type Response = Res<WebRequestAddendum, WebResponseAddendum> & WebResponseAddendum

export type WebApp = App<WebRequestAddendum, WebResponseAddendum>

export type Router = R<WebRequestAddendum, WebResponseAddendum>
