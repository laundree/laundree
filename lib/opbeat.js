/**
 * Created by budde on 11/09/16.
 */
const config = require('config')
const debug = require('debug')('laundree.lib.opbeat')
var opbeat

if (config.opbeat.appId) {
  opbeat = require('opbeat').start({
    appId: config.get('opbeat.appId'),
    organizationId: config.get('opbeat.organizationId'),
    secretToken: config.get('opbeat.secretToken')
  })
} else {
  debug('Opbeat is not enabled.')
}

module.exports = opbeat
