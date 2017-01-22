/**
 * Created by budde on 21/10/2016.
 */

const request = require('superagent')
const EventEmitter = require('events')

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

let jobId = 1

function setupF (f, instance, functionName) {
  f[functionName] = function () {
    return instance[functionName].apply(instance, arguments)
  }
}

function sanitizeUrl (url) {
  if (!url.endsWith('/')) return url
  return sanitizeUrl(url.substr(0, url.length - 1))
}

class Sdk {

  constructor (baseUrl = '') {
    this.baseUrl = sanitizeUrl(baseUrl)
  }

  get user () {
    const f = (id) => new UserSdk(this.baseUrl, id)
    const user = new UserSdk(this.baseUrl)
    setupF(f, user, 'fromEmail')
    setupF(f, user, 'createUser')
    setupF(f, user, 'signUpUser')
    setupF(f, user, 'startEmailVerification')
    setupF(f, user, 'forgotPassword')
    return f
  }

  get machine () {
    return (id) => new MachineSdk(this.baseUrl, id)
  }

  get laundry () {
    const f = (id) => new LaundrySdk(this.baseUrl, id)
    const laundry = new LaundrySdk(this.baseUrl)
    setupF(f, laundry, 'createDemoLaundry')
    setupF(f, laundry, 'createLaundry')
    return f
  }

  get invite () {
    return (id) => new InviteSdk(this.baseUrl, id)
  }

  get booking () {
    return (id) => new BookingSdk(this.baseUrl, id)
  }

  contact ({name, email, subject, message}) {
    return post(this.baseUrl + '/api/contact', {name, email, subject, message})
  }

  setupRedux (store, socket) {
    this.socket = socket
    this.jobEventEmitter = new EventEmitter()
    store.subscribe(() => this.jobEventEmitter.emit(store.getState().jobs))
  }

  emit (action) {
    const jId = jobId++
    const args = Array.prototype.slice.call(arguments, 1)
    const opts = {jobId: jId}
    const newArgs = [action, opts].concat(args)
    return new Promise(resolve => {
      this.jobEventEmitter.once(jId, resolve)
      this.socket.emit.apply(this.socket, newArgs)
    })
  }

  listBookingsInTime (laundryId, from, to) {
    return this.emit('listBookingsInTime', laundryId, from, to)
  }

  listBookingsForUser (laundryId, userId, filter = {}) {
    return this.emit('listBookingsForUser', laundryId, userId, filter)
  }

  listUsersAndInvites (laundryId) {
    return this.emit('listUsersAndInvites', laundryId)
  }

  listUsers (options) {
    return this.emit('listUsers', options)
  }

  listMachines (laundryId) {
    return this.emit('listMachines', laundryId)
  }

  listLaundries (options) {
    return this.emit('listLaundries', options)
  }

  listMachinesAndUsers (laundryId) {
    return this.emit('listMachinesAndUsers', laundryId)
  }

  fetchLaundry (laundryId) {
    return this.emit('fetchLaundry', laundryId)
  }

  fetchUser (userId) {
    return this.emit('fetchUser', userId)
  }

  updateStats () {
    return this.emit('updateStats')
  }
}

class ResourceSdk {
  constructor (resourcePath, baseUrl = '', id = '') {
    this.resourcePath = resourcePath
    this.id = id
    this.baseUrl = baseUrl
  }

  get () {
    return get(`${this.baseUrl}/api/${this.resourcePath}/${this.id}`).then(({body}) => body)
  }

  del () {
    return del(`${this.baseUrl}/api/${this.resourcePath}/${this.id}`)
  }
}

class UserSdk extends ResourceSdk {

  constructor (baseUrl, id) {
    super('users', baseUrl, id)
  }

  fromEmail (email) {
    return get(`${this.baseUrl}/api/users?email=${encodeURIComponent(email)}`)
      .then(({body}) => {
        if (!body) return null
        if (body.length !== 1) return null
        return body[0]
      })
  }

  createUser (displayName, email, password) {
    return post(`${this.baseUrl}/api/users`, {displayName, email, password})
      .then(({body}) => {
        if (!body) return null
        return body
      })
  }

  signUpUser (name, email, password) {
    return this
      .createUser(name, email, password)
      .then(({id}) => new UserSdk(this.baseUrl, id)
        .startEmailVerification(email))
  }

  startEmailVerification (email) {
    return this
      .fromEmail(email)
      .then(user => {
        if (!user) throw new Error('User not found')
        return new UserSdk(this.baseUrl, user.id)
          ._startEmailVerification(email)
      })
  }

  forgotPassword (email) {
    return this
      .fromEmail(email)
      .then(user => {
        if (!user) throw new Error('User not found')
        return new UserSdk(this.baseUrl, user.id)
          .startPasswordReset()
      })
  }

  resetPassword (token, password) {
    return post(`${this.baseUrl}/api/users/${this.id}/password-reset`, {token, password})
  }

  listEmails () {
    return get(`${this.baseUrl}/api/users/${this.id}/emails`).then(({body}) => body)
  }

  updateName (name) {
    return put(`${this.baseUrl}/api/users/${this.id}`, {name})
  }

  changePassword (currentPassword, newPassword) {
    return post(`${this.baseUrl}/api/users/${this.id}/password-change`, {currentPassword, newPassword})
  }

  startPasswordReset () {
    return post(`${this.baseUrl}/api/users/${this.id}/start-password-reset`)
  }

  _startEmailVerification (email) {
    return post(`${this.baseUrl}/api/users/${this.id}/start-email-verification`, {email})
  }

}

class MachineSdk extends ResourceSdk {

  constructor (baseUrl, id) {
    super('machines', baseUrl, id)
  }

  /**
   * Update machine
   * @param {{name:string=, type: string=}} params
   */
  updateMachine (params) {
    return put(`${this.baseUrl}/api/machines/${this.id}`, params)
  }

  /**
   * Create a booking
   * @param {Date} from
   * @param {Date} to
   */
  createBooking (from, to) {
    return post(`${this.baseUrl}/api/machines/${this.id}/bookings`, {from: from, to: to})
  }
}

class LaundrySdk extends ResourceSdk {

  constructor (baseUrl, id) {
    super('laundries', baseUrl, id)
  }

  createLaundry (name, googlePlaceId) {
    return post(`${this.baseUrl}/api/laundries`, {name, googlePlaceId})
      .then(response => response.body || null)
  }

  /**
   * Create a demo landry
   * @returns {Promise.<{email: string, password: string}>}
   */
  createDemoLaundry () {
    return post(`${this.baseUrl}/api/laundries/demo`)
      .then(({body}) => body)
  }

  updateLaundry ({name, googlePlaceId, rules}) {
    return put(`${this.baseUrl}/api/laundries/${this.id}`, {name, googlePlaceId, rules})
  }

  createMachine (name, type) {
    return post(`${this.baseUrl}/api/laundries/${this.id}/machines`, {name, type})
  }

  inviteUserByEmail (email) {
    return post(`${this.baseUrl}/api/laundries/${this.id}/invite-by-email`, {email})
  }

  removeUserFromLaundry (userId) {
    return del(`${this.baseUrl}/api/laundries/${this.id}/users/${userId}`)
  }

  createInviteCode () {
    return post(`${this.baseUrl}/api/laundries/${this.id}/invite-code`).then(({body}) => body)
  }

  addOwner (userId) {
    return post(`${this.baseUrl}/api/laundries/${this.id}/owners/${userId}`)
  }

  removeOwner (userId) {
    return del(`${this.baseUrl}/api/laundries/${this.id}/owners/${userId}`)
  }
}

class InviteSdk extends ResourceSdk {

  constructor (baseUrl, id) {
    super('invites', baseUrl, id)
  }
}

class BookingSdk extends ResourceSdk {

  constructor (baseUrl, id) {
    super('bookings', baseUrl, id)
  }
}

module.exports = Sdk
