const config = require('config')
const {opbeat} = require('../lib/opbeat')

function logError (err) {
  if (config.get('logging.error.enabled')) console.error(err)
  if (opbeat) opbeat.captureError(err)
}

module.exports = {logError}
