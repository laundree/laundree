const config = require('config')
const opbeat = require('../lib/opbeat')

function logError (err) {
  if (!config.get('logging.error.enabled')) return
  console.error(err)
  if (!opbeat) return
  opbeat.captureError(err)
}

module.exports = {logError: logError}
