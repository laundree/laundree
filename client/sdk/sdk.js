/**
 * Created by budde on 09/10/16.
 */

const request = require('superagent')

class Sdk {

  get user () {
    const f = (id) => new UserSdk(id)
    f.fromEmail = UserSdk.fromEmail
    f.createUser = UserSdk.createUser
    f.signUpUser = UserSdk.signUpUser
    f.startEmailVerification = UserSdk.startEmailVerification
    f.forgotPassword = UserSdk.forgotPassword
    return f
  }

  get machine () {
    return (id) => new MachineSdk(id)
  }

  get laundry () {
    const f = (id) => new LaundrySdk(id)
    f.createDemoLaundry = LaundrySdk.createDemoLaundry
    f.createLaundry = LaundrySdk.createLaundry
    return f
  }

  get invite () {
    return (id) => new InviteSdk(id)
  }

  get booking () {
    return (id) => new BookingSdk(id)
  }

  contact ({name, email, subject, message}) {
    return request
      .post(`/api/contact`)
      .send({name, email, subject, message})
      .then()
  }

  setupRedux (store, socket) {
    this.store = store
    this.socket = socket
  }

  listBookingsInTime (laundryId, from, to) {
    return this.socket.emit('listBookingsInTime', laundryId, from.getTime(), to.getTime())
  }

  listBookingsForUser (laundryId, userId, filter = {}) {
    return this.socket.emit('listBookingsForUser', laundryId, userId, filter)
  }

  listUsersAndInvites (laundryId) {
    return this.socket.emit('listUsersAndInvites', laundryId)
  }

  listUsers () {
    return this.socket.emit('listUsers')
  }

  listMachines (laundryId) {
    return this.socket.emit('listMachines', laundryId)
  }

  listLaundries () {
    return this.socket.emit('listLaundries')
  }

  listMachinesAndUsers (laundryId) {
    return this.socket.emit('listMachinesAndUsers', laundryId)
  }

  updateStats () {
    return this.socket.emit('updateStats')
  }
}

class ResourceSdk {
  constructor (id) {
    this.id = id
  }
}

class UserSdk extends ResourceSdk {
  static fromEmail (email) {
    return request
      .get(`/api/users?email=${encodeURIComponent(email)}`)
      .then(({body}) => {
        if (!body) return null
        if (body.length !== 1) return null
        return body[0]
      })
  }

  static createUser (displayName, email, password) {
    return request
      .post('/api/users')
      .send({displayName, email, password})
      .then(({body}) => {
        if (!body) return null
        return body
      })
  }

  static signUpUser (name, email, password) {
    return UserSdk
      .createUser(name, email, password)
      .then(({id}) => new UserSdk(id)
        .startEmailVerification(email))
  }

  static startEmailVerification (email) {
    return UserSdk
      .fromEmail(email)
      .then(user => {
        if (!user) throw new Error('User not found')
        return new UserSdk(user.id)
          .startEmailVerification(email)
      })
  }

  static forgotPassword (email) {
    return UserSdk
      .fromEmail(email)
      .then(user => {
        if (!user) throw new Error('User not found')
        return new UserSdk(user.id)
          .startPasswordReset()
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

class MachineSdk extends ResourceSdk {

  deleteMachine () {
    return request
      .delete(`/api/machines/${this.id}`)
      .then()
  }

  /**
   * Update machine
   * @param {{name:string=, type: string=}} params
   */
  updateMachine (params) {
    return request
      .put(`/api/machines/${this.id}`)
      .send(params)
      .then()
  }

  /**
   * Create a booking
   * @param {Date} from
   * @param {Date} to
   */
  createBooking (from, to) {
    return request
      .post(`/api/machines/${this.id}/bookings`)
      .send({from: from.toISOString(), to: to.toISOString()})
      .then()
  }
}

class LaundrySdk extends ResourceSdk {

  static createLaundry (name) {
    return request
      .post('/api/laundries')
      .send({name})
      .then((response) => response.body || null)
  }

  /**
   * Create a demo landry
   * @returns {Promise.<{email: string, password: string}>}
   */
  static createDemoLaundry () {
    return request
      .post('/api/laundries/demo')
      .then(({body}) => body)
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

class InviteSdk extends ResourceSdk {
  deleteInvite () {
    return request
      .delete(`/api/invites/${this.id}`)
      .then()
  }
}

class BookingSdk extends ResourceSdk {

  deleteBooking () {
    return request
      .delete(`/api/bookings/${this.id}`)
      .then()
  }
}

module.exports = Sdk
