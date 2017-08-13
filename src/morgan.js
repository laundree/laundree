// @flow

import config from 'config'
import logger from 'morgan'
import type { Application as App } from 'express'

export default function setup (app: App<*, *>) {
  if (!config.get('logging.http.enabled')) return
  app.use(logger(config.get('logging.http.format')))
}
