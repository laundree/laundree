// @flow

import type { LocaleType } from '../../locales/index'

export type Config = {
  locale: LocaleType,
  googleApiKey: string,
  apiBase: string,
  socketIoBase: string,
  token: string

}

export type StateAddendum = {
  config: Config
}
