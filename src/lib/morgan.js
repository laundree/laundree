/**
 * Created by budde on 15/05/16.
 */

const config = require('config')
const logger = require('morgan')

function setup (app) {
  if (!config.get('logging.http.enabled')) return
  app.use(logger(config.get('logging.http.format')))
}

module.exports = setup
