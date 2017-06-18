// @flow
import config from 'config'
import Debug from 'debug'
import os from 'os'
import Opbeat from 'opbeat'

const debug = Debug('laundree.lib.opbeat')

export let opbeat

if (config.get('opbeat.enable')) {
  opbeat = Opbeat.start({
    appId: config.get('opbeat.appId'),
    organizationId: config.get('opbeat.organizationId'),
    secretToken: config.get('opbeat.secretToken')
  })
} else {
  debug('Opbeat is not enabled.')
}

export function trackRelease () {
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
