/**
 * Created by budde on 06/05/16.
 */
const request = require('superagent')

class LaundryClientSdk {

  constructor (id) {
    this.id = id
  }

  static createLaundry (name) {
    return request
      .post('/api/laundries')
      .send({name})
      .then((response) => response.body || null)
  }

  updateName (name) {
    return request
      .put(`/api/laundries/${this.id}`)
      .send({name})
      .then()
  }

  createMachine (name, type) {
    return request
      .post(`/api/laundries/${this.id}/machines`)
      .send({name, type})
      .then()
  }

  inviteUserByEmail (email) {
    return request
      .post(`/api/laundries/${this.id}/invite-by-email`)
      .send({email})
      .then()
  }

  deleteLaundry () {
    return request
      .delete(`/api/laundries/${this.id}`)
      .then()
  }

  removeUserFromLaundry (userId) {
    return request
      .delete(`/api/laundries/${this.id}/users/${userId}`)
      .then()
  }
}

module.exports = LaundryClientSdk
