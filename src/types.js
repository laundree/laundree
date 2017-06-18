// @flow
import type { Request as Req, Response as Res, Application as App, Router as R } from 'express'
import type UserHandler from './handlers/user'
import type { LocaleType } from './locales'

type CustomRequestAddendum = {
  user: ?UserHandler,
  locale?: LocaleType,
  swagger?: {
    apiPath: string
  },
  session: {
    returningUser?: boolean,
    to?: string,
    errorTo?: string,
    locale?: LocaleType
  },
  logout: () => void,
  flash: (type: string) => string[]
}

type CustomResponseAddendum = {
  renderHb: (file: string, options: Object) => void
}

export type Request = Req<CustomRequestAddendum, CustomResponseAddendum> & CustomRequestAddendum

export type Response = Res<CustomRequestAddendum, CustomResponseAddendum> & CustomResponseAddendum

export type Application = App<CustomRequestAddendum, CustomResponseAddendum>

export type Router = R<CustomRequestAddendum, CustomResponseAddendum>
