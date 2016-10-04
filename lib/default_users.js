const config = require('config')
const debug = require('debug')('laundree.setups.default_users')
const {UserHandler} = require('../handlers')

function defaultUserSetup () {
  if (config.get('mode') !== 'master') return Promise.resolve()
  debug('Setting up default users')
  const defaultUsers = config.get('defaultAdmins')
  return UserHandler.find({'profiles.emails.value': defaultUsers, role: {$ne: 'admin'}}).then(users => {
    debug(`Found ${users.length} user(s) to update`)
    return Promise
      .all(users.map(user => user.updateRole('admin')))
      .then(() => debug('done'))
  })
}

module.exports = defaultUserSetup
