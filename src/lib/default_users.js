const config = require('config')
const debug = require('debug')('laundree.setups.default_users')
const {UserHandler} = require('../handlers')
const {logError} = require('../utils/error')

function defaultUserSetup () {
  if (config.get('mode') !== 'master') return Promise.resolve()
  debug('Setting up default users')
  const defaultUsers = config.get('defaultUsers')
  return Promise
    .all(Object
      .keys(defaultUsers)
      .map(user => {
        const role = defaultUsers[user]
        return UserHandler
          .find({'profiles.emails.value': user, role: {$ne: role}})
          .then(users => Promise
            .all(users
              .map(u => u
                .updateRole(role)
                .then(() => debug(`Updated user with email: ${user} and new role: ${role}`)))))
      }))
    .catch(logError)
}

module.exports = defaultUserSetup
