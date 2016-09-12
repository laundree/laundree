/**
 * Created by budde on 11/09/16.
 */
const config = require('config')
const debug = require('debug')('laundree.lib.opbeat')
const Promise = require('promise')
const os = require('os')

var opbeat

if (config.get('opbeat.enable')) {
  opbeat = require('opbeat').start({
    appId: config.get('opbeat.appId'),
    organizationId: config.get('opbeat.organizationId'),
    secretToken: config.get('opbeat.secretToken')
  })
} else {
  debug('Opbeat is not enabled.')
}

function trackRelease () {
  if (!config.get('opbeat.trackRelease')) return Promise.resolve()
  if (!opbeat) return Promise.resolve()
  return new Promise((resolve, reject) => {
    debug('Tracking release')
    opbeat.trackRelease({
      status: 'machine-completed',
      machine: os.hostname()
    }, (err) => {
      if (err) {
        debug('Tracking failed with error: ', err)
        return reject(err)
      }
      debug('Release tracked')
      resolve()
    })
  })
}

module.exports = {opbeat, trackRelease}
