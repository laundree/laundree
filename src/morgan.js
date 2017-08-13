// @flow

import config from 'config'
import logger from 'morgan'
import type {Application} from './web/types'

export default function setup (app: Application) {
  if (!config.get('logging.http.enabled')) return
  app.use(logger(config.get('logging.http.format')))
}
