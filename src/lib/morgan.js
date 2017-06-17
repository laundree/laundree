// @flow

import config from 'config'
import logger from 'morgan'

export default function setup (app: express$Application) {
  if (!config.get('logging.http.enabled')) return
  app.use(logger(config.get('logging.http.format')))
}
