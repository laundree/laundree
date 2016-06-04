const config = require('config')

function logError (err) {
  if (!config.get('logging.error.enabled')) return
  console.error(err)
}

module.exports = {logError: logError}
