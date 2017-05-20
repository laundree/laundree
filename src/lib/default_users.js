// @flow
import config from 'config'
import Debug from 'debug'
import UserHandler from '../handlers/user'
import {logError} from '../utils/error'

const debug = Debug('laundree.setups.default_users')

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
          .lib
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
