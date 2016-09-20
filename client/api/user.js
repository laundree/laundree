/**
 * Created by budde on 06/05/16.
 */
const request = require('superagent')

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
    return request
      .get(`/api/users?email=${encodeURIComponent(email)}`)
      .then(({body}) => {
        if (!body) return null
        if (body.length !== 1) return null
        return new UserClientApi(body[0].id, body[0])
      })
  }

  resetPassword (token, password) {
    return request
      .post(`/api/users/${this.id}/password-reset`)
      .send({token, password})
      .then()
  }

  updateName (name) {
    return request
      .put(`/api/users/${this.id}`)
      .send({name})
      .then()
  }

  changePassword (currentPassword, newPassword) {
    return request
      .post(`/api/users/${this.id}/password-change`)
      .send({currentPassword, newPassword})
      .then()
  }

  static createUser (displayName, email, password) {
    return request
      .post('/api/users')
      .send({displayName, email, password})
      .then(({body}) => {
        if (!body) return null
        return new UserClientApi(body.id, body)
      })
  }

  startPasswordReset () {
    return request
      .post(`/api/users/${this.id}/start-password-reset`)
      .then()
  }

  startEmailVerification (email) {
    return request
      .post(`/api/users/${this.id}/start-email-verification`)
      .send({email})
      .then()
  }
}

module.exports = UserClientApi
