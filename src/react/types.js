// @flow

import type { LocaleType } from '../locales/index'

export type Config = {
  locale: LocaleType,
  googleApiKey: string,
  webBase: string,
  apiBase: string,
  socketIoBase: string,
  statistics: {userCount: number, bookingCount: number},
  token: string
}

export type StateAddendum = {
  config: Config
}
