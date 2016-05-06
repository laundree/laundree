/**
 * Created by budde on 06/05/16.
 */
var rest = require('rest')
var mime = require('rest/interceptor/mime')
var errorCode = require('rest/interceptor/errorCode')

var client = rest.wrap(mime).wrap(errorCode)

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
    }).then((response) => {
      var entity = response.entity
      if (!entity) return null
      if (entity.length !== 1) return null
      return new UserClientApi(entity[0].id, entity[0])
    })
  }

  static createUser (displayName, email, password) {
    return client({
      path: '/api/users',
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      entity: {displayName: displayName, email: email, password: password}
    }).then((response) => {
      var entity = response.entity
      if (!entity) return null
      return new UserClientApi(entity.id, entity)
    })
  }
}

module.exports = UserClientApi
