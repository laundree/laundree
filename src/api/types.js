// @flow
import type { Request as Req, Response as Res, Application as App, Router as R } from 'express'

type CustomRequestAddendum = {
  jwt?: {
    userId?: string
  },
  swagger: {
    apiPath: string,
    params: {[string]: {value: *}}
  }
}

type CustomResponseAddendum = {
  renderHb: (file: string, options: Object) => void
}

export type Request = Req<CustomRequestAddendum, CustomResponseAddendum> & CustomRequestAddendum

export type Response = Res<CustomRequestAddendum, CustomResponseAddendum> & CustomResponseAddendum

export type Application = App<CustomRequestAddendum, CustomResponseAddendum>

export type Router = R<CustomRequestAddendum, CustomResponseAddendum>
