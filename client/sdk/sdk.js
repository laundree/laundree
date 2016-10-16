/**
 * Created by budde on 09/10/16.
 */

const request = require('superagent')

function req (method, path, data = null) {
  const req = request[method](path)
  if (!data) return req.then()
  return req
    .send(data)
    .then()
}

function post (path, data = null) {
  return req('post', path, data)
}

function del (path) {
  return req('delete', path)
}

function put (path, data = null) {
  return req('put', path, data)
}

function get (path) {
  return req('get', path)
}

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
    return post('/api/contact', {name, email, subject, message})
  }

  setupRedux (store, socket) {
    this.store = store
    this.socket = socket
  }

  emit (action) {
    const args = Array.prototype.slice.call(arguments, 1)
    const opts = {}
    const newArgs = [action, opts].concat(args)
    return this.socket.emit.apply(this.socket, newArgs)
  }

  listBookingsInTime (laundryId, from, to) {
    return this.emit('listBookingsInTime', laundryId, from.getTime(), to.getTime())
  }

  listBookingsForUser (laundryId, userId, filter = {}) {
    return this.emit('listBookingsForUser', laundryId, userId, filter)
  }

  listUsersAndInvites (laundryId) {
    return this.emit('listUsersAndInvites', laundryId)
  }

  listUsers () {
    return this.emit('listUsers')
  }

  listMachines (laundryId) {
    return this.emit('listMachines', laundryId)
  }

  listLaundries () {
    return this.emit('listLaundries')
  }

  listMachinesAndUsers (laundryId) {
    return this.emit('listMachinesAndUsers', laundryId)
  }

  updateStats () {
    return this.emit('updateStats')
  }
}

class ResourceSdk {
  constructor (id) {
    this.id = id
  }
}

class UserSdk extends ResourceSdk {
  static fromEmail (email) {
    return get(`/api/users?email=${encodeURIComponent(email)}`)
      .then(({body}) => {
        if (!body) return null
        if (body.length !== 1) return null
        return body[0]
      })
  }

  static createUser (displayName, email, password) {
    return post('/api/users', {displayName, email, password})
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
    return post(`/api/users/${this.id}/password-reset`, {token, password})
  }

  updateName (name) {
    return put(`/api/users/${this.id}`, {name})
  }

  changePassword (currentPassword, newPassword) {
    return post(`/api/users/${this.id}/password-change`, {currentPassword, newPassword})
  }

  startPasswordReset () {
    return post(`/api/users/${this.id}/start-password-reset`)
  }

  startEmailVerification (email) {
    return post(`/api/users/${this.id}/start-email-verification`, {email})
  }
}

class MachineSdk extends ResourceSdk {

  deleteMachine () {
    return del(`/api/machines/${this.id}`)
  }

  /**
   * Update machine
   * @param {{name:string=, type: string=}} params
   */
  updateMachine (params) {
    return put(`/api/machines/${this.id}`, params)
  }

  /**
   * Create a booking
   * @param {Date} from
   * @param {Date} to
   */
  createBooking (from, to) {
    return post(`/api/machines/${this.id}/bookings`, {from: from.toISOString(), to: to.toISOString()})
  }
}

class LaundrySdk extends ResourceSdk {

  static createLaundry (name) {
    return post('/api/laundries', {name})
      .then((response) => response.body || null)
  }

  /**
   * Create a demo landry
   * @returns {Promise.<{email: string, password: string}>}
   */
  static createDemoLaundry () {
    return post('/api/laundries/demo')
      .then(({body}) => body)
  }

  updateName (name) {
    return put(`/api/laundries/${this.id}`, {name})
  }

  createMachine (name, type) {
    return post(`/api/laundries/${this.id}/machines`, {name, type})
  }

  inviteUserByEmail (email) {
    return post(`/api/laundries/${this.id}/invite-by-email`, {email})
  }

  deleteLaundry () {
    return del(`/api/laundries/${this.id}`)
  }

  removeUserFromLaundry (userId) {
    return del(`/api/laundries/${this.id}/users/${userId}`)
  }
}

class InviteSdk extends ResourceSdk {
  deleteInvite () {
    return del(`/api/invites/${this.id}`)
  }
}

class BookingSdk extends ResourceSdk {

  deleteBooking () {
    return del(`/api/bookings/${this.id}`)
  }
}

module.exports = Sdk
