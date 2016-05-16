/**
 * Created by budde on 06/05/16.
 */
var rest = require('rest')
var mime = require('rest/interceptor/mime')
var errorCode = require('rest/interceptor/errorCode')

var client = rest.wrap(mime).wrap(errorCode)

function wrapError (req) {
  var error = new Error(req.entity.message)
  error.status = req.status.code
  throw error
}

class UserClientApi {

  constructor (id, model) {
    this.id = id
    this.model = model
  }

  /**
   * Returns user if available else null.
   * @param {string} email
   * @return {Promise.<UserClientApi>}
   */
  static userFromEmail (email) {
    return client({
      path: `/api/users?email=${email}`,
      method: 'GET'
    }).catch(wrapError).then((response) => {
      var entity = response.entity
      if (!entity) return null
      if (entity.length !== 1) return null
      return new UserClientApi(entity[0].id, entity[0])
    })
  }

  resetPassword (token, password) {
    return client({
      path: `/api/users/${this.id}/password-reset`,
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      entity: {token: token, password: password}
    }).catch(wrapError)
  }

  static createUser (displayName, email, password) {
    return client({
      path: '/api/users',
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      entity: {displayName: displayName, email: email, password: password}
    })
      .catch(wrapError)
      .then((response) => {
        var entity = response.entity
        if (!entity) return null
        return new UserClientApi(entity.id, entity)
      })
  }

  startPasswordReset () {
    return client({
      path: `/api/users/${this.id}/start-password-reset`,
      method: 'POST',
      headers: {'Content-Type': 'application/json'}
    }).catch(wrapError)
  }

  startEmailVerification (email) {
    return client({
      path: `/api/users/${this.id}/start-email-verification`,
      method: 'POST',
      entity: {email: email},
      headers: {'Content-Type': 'application/json'}
    }).catch(wrapError)
  }
}

module.exports = UserClientApi
