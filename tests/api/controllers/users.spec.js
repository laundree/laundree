var request = require('supertest-as-promised')
var app = require('../../../app').app
var chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()

var dbUtils = require('../../db_utils')
const {UserHandler, TokenHandler} = require('../../../handlers')
const Promise = require('promise')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('users', function () {
    this.timeout(5000)
    describe('GET /api/users/{id}', () => {
      it('should fail on auth', () =>
        request(app)
          .get('/api/users/asd123')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/))

      it('should return error', () =>
        request(app)
          .get('/api/users/asd123')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404))

      it('should return error on missing but right format', () =>
        request(app)
          .get('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404))

      it('should find user', () =>
        dbUtils.populateTokens(1).then(({user}) =>
          request(app)
            .get(`/api/users/${user.model.id}`)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .then(res =>
              user.toRest()
                .then((u) => {
                  const cleanUser = Object.keys(u).filter(k => u[k] !== undefined).reduce((o, k) => {
                    o[k] = u[k]
                    return o
                  }, {})
                  res.body.should.be.deep.equal(cleanUser)
                }))))

      it('should find user 2', () =>
        UserHandler
          .createUserWithPassword('Foo Bob Bårsen', 'foo@bar.com', 'password')
          .then(user =>
            request(app)
              .get(`/api/users/${user.model.id}`)
              .set('Accept', 'application/json')
              .expect(200)
              .expect('Content-Type', /json/)
              .then(res =>
                user.toRest()
                  .then((u) => {
                    const cleanUser = Object.keys(u).filter(k => u[k] !== undefined).reduce((o, k) => {
                      o[k] = u[k]
                      return o
                    }, {})
                    res.body.should.be.deep.equal(cleanUser)
                  }))))

      it('should find user 3', () => {
        const UserModel = require('../../../models/user')
        return new UserModel({
          updatedAt: new Date('2016-09-23T06:39:16.495Z'),
          createdAt: new Date('2016-09-23T06:37:49.206Z'),
          latestProvider: 'local',
          profiles: [{
            id: 'asdasdasd@gmail.com',
            displayName: 'Bob Bobe Bobbesen',
            provider: 'local',
            photos: [{value: '/identicon/asdasdasd@gmail.com/150.svg'}],
            emails: [{value: 'asdasdasd@gmail.com'}],
            name: {givenName: 'Bob', middleName: 'Bobe', familyName: 'Bobbesen'}
          }],
          explicitVerificationEmailTokens: [],
          explicitVerifiedEmails: ['asdasdasd@gmail.com'],
          laundries: [],
          authTokens: [],
          password: 'asdasdasd',
          lastSeen: new Date('2016-09-23T06:38:33.364Z')
        })
          .save()
          .then(u => UserHandler.findFromId(u.id))
          .then(user =>
            request(app)
              .get(`/api/users/${user.model.id}`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .then(res => user.toRest().then((u) => {
                const cleanUser = Object.keys(u).filter(k => u[k] !== undefined).reduce((o, k) => {
                  o[k] = u[k]
                  return o
                }, {})
                res.body.should.be.deep.equal(cleanUser)
              })))
      })
    })
    describe('PUT /api/users/{id}', () => {
      it('should fail on auth', () =>
        request(app)
          .put('/api/users/asd123')
          .send({name: 'Kurt Frandsen'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return error on missing but right format', () =>
        dbUtils
          .populateTokens(1)
          .then(({token, user}) =>
            request(app)
              .put('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa')
              .send({name: 'Kurt Frandsen'})
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(404)))

      it('should update user', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          request(app)
            .put(`/api/users/${user.model.id}`)
            .auth(user.model.id, token.secret)
            .send({name: 'Kurt Frandsen'})
            .set('Accept', 'application/json')
            .expect(204)
            .then(res =>
              UserHandler.find({_id: user.model._id})
                .then(([user]) => {
                  user.model.displayName.should.equal('Kurt Frandsen')
                }))))
      it('should update user when admin', () =>
        Promise
          .all([dbUtils.populateTokens(1), dbUtils.createAdministrator()])
          .then(([{user}, {user: admin, token}]) =>
            request(app)
              .put(`/api/users/${user.model.id}`)
              .auth(admin.model.id, token.secret)
              .send({name: 'Kurt Frandsen'})
              .set('Accept', 'application/json')
              .expect(204)
              .then(res =>
                UserHandler.find({_id: user.model._id})
                  .then(([user]) => {
                    user.model.displayName.should.equal('Kurt Frandsen')
                  }))))
      it('should not update user', () =>
        Promise
          .all([
            dbUtils.populateTokens(1),
            dbUtils.populateTokens(1)
          ])
          .then(([{user: user1, token}, {user: user2}]) =>
            request(app)
              .put(`/api/users/${user2.model.id}`)
              .auth(user1.model.id, token.secret)
              .send({name: 'Kurt Frandsen'})
              .set('Accept', 'application/json')
              .expect(403)))
    })

    describe('POST /api/users/{id}/password-change', () => {
      it('should fail on auth', () =>
        request(app)
          .post('/api/users/asd123/password-change')
          .send({currentPassword: 'password', newPassword: 'password'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return error on missing but right format', () =>
        dbUtils
          .populateTokens(1)
          .then(({token, user}) =>
            request(app)
              .post('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa/password-change')
              .send({currentPassword: 'password', newPassword: 'password'})
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(404)))

      it('should update user', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          user
            .resetPassword('password')
            .then(() =>
              request(app)
                .post(`/api/users/${user.model.id}/password-change`)
                .auth(user.model.id, token.secret)
                .send({currentPassword: 'password', newPassword: 'password2'})
                .set('Accept', 'application/json')
                .expect(204)
                .then(res => UserHandler
                  .find({_id: user.model._id})
                  .then(([user]) => user
                    .verifyPassword('password2')
                    .then(r => Boolean(r))
                    .should
                    .eventually.be.true)))))

      it('should update user when no current password', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          request(app)
            .post(`/api/users/${user.model.id}/password-change`)
            .auth(user.model.id, token.secret)
            .send({currentPassword: 'password', newPassword: 'password2'})
            .set('Accept', 'application/json')
            .expect(204)
            .then(res => UserHandler
              .find({_id: user.model._id})
              .then(([user]) => user
                .verifyPassword('password2')
                .then(r => Boolean(r))
                .should.eventually.be.true))))

      it('should fail with invalid input', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          request(app)
            .post(`/api/users/${user.model.id}/password-change`)
            .auth(user.model.id, token.secret)
            .send({currentPassword: 'p', newPassword: 'p2'})
            .set('Accept', 'application/json')
            .expect(400)))

      it('should fail with wrong current password', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          user
            .resetPassword('password')
            .then(() =>
              request(app)
                .post(`/api/users/${user.model.id}/password-change`)
                .auth(user.model.id, token.secret)
                .send({currentPassword: 'password1', newPassword: 'password2'})
                .set('Accept', 'application/json')
                .expect(403))))

      it('should not update user', () =>
        Promise
          .all([
            dbUtils.populateTokens(1),
            dbUtils.populateTokens(1)
          ])
          .then(([{user: user1, token}, {user: user2}]) =>
            request(app)
              .post(`/api/users/${user2.model.id}/password-change`)
              .auth(user1.model.id, token.secret)
              .send({currentPassword: 'password', newPassword: 'password'})
              .set('Accept', 'application/json')
              .expect(403)))
    })

    describe('GET /api/users', () => {
      it('should return an empty list', () =>
        request(app)
          .get('/api/users')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
          .expect(200)
          .then(res => res.body.should.deep.equal([])))

      it('should limit output size', () =>
        dbUtils.populateUsers(100).then((users) =>
          request(app)
            .get('/api/users')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => {
              var arr = users.slice(0, 10).map((user) => user.toRestSummary())
              res.body.should.deep.equal(arr)
            })))

      it('should allow custom output size', () =>
        dbUtils.populateUsers(100).then((users) =>
          request(app)
            .get('/api/users')
            .query({page_size: 12})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => {
              var arr = users.slice(0, 12).map((user) => user.toRestSummary())
              res.body.should.deep.equal(arr)
            })))

      it('should allow since', () =>
        dbUtils.populateUsers(100).then((users) =>
          request(app)
            .get('/api/users')
            .query({since: users[55].model.id, page_size: 1})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => res.body.should.deep.equal([users[56].toRestSummary()]))))

      it('should allow email filter', () =>
        dbUtils.populateUsers(10).then((users) =>
          request(app)
            .get('/api/users')
            .query({email: users[5].model.emails[0]})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => res.body.should.be.deep.equal([users[5].toRestSummary()]))))
    })

    describe('POST /api/users', () => {
      it('should succede with right body', () =>
        request(app)
          .post('/api/users')
          .send({displayName: 'Bob Bobbesen', email: 'bob@example.com', password: 'password1234'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(() => UserHandler.findFromEmail('bob@example.com').then((u) => u.should.not.be.undefined)))

      it('should fail on invalid email in body', () =>
        request(app)
          .post('/api/users')
          .send({displayName: 'Bob Bobbesen', email: 'invalid', password: 'password1234'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400))

      it('should fail on invalid name in body', () =>
        request(app)
          .post('/api/users')
          .send({displayName: '', email: 'a@example.com', password: 'password1234'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400))

      it('should fail on invalid password in body', () =>
        request(app)
          .post('/api/users')
          .send({displayName: 'Bob', email: 'a@example.com', password: 'asdfg'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400))
    })
    describe('GET /api/users/{id}/emails', () => {
      it('should succeed on self', () => dbUtils
        .populateTokens(1)
        .then(({user, token}) => request(app)
          .get(`/api/users/${user.model.id}/emails`)
          .auth(user.model.id, token.secret)
          .send()
          .expect(200)
          .then(({body}) => body.should.deep.equal(user.model.emails))))

      it('should succeed on admin', () =>
        Promise.all([dbUtils.populateTokens(1), dbUtils.createAdministrator()])
          .then(([{user}, {user: admin, token}]) => request(app)
            .get(`/api/users/${user.model.id}/emails`)
            .auth(admin.model.id, token.secret)
            .send()
            .expect(200)
            .then(({body}) => body.should.deep.equal(user.model.emails))))

      it('should fail on other', () =>
        Promise.all([dbUtils.populateTokens(1), dbUtils.populateTokens(1)])
          .then(([{user}, {user: otherUser, token}]) => request(app)
            .get(`/api/users/${user.model.id}/emails`)
            .auth(otherUser.model.id, token.secret)
            .send()
            .expect(403)))

      it('should fail without auth', () =>
        Promise.all([dbUtils.populateTokens(1), dbUtils.populateTokens(1)])
          .then(([{user}, {user: otherUser, token}]) => request(app)
            .get(`/api/users/${user.model.id}/emails`)
            .send()
            .expect(403)))
    })
    describe('POST /api/users/{id}/start-password-reset', () => {
      it('should fail on no user', () =>
        dbUtils.populateUsers(2).then(() =>
          request(app)
            .post('/api/users/aaa/start-password-reset')
            .set('Accept', 'application/json')
            .send()
            .expect('Content-Type', /json/)
            .expect(404)))

      it('should fail on no user', () =>
        dbUtils.populateUsers(2).then(() =>
          request(app)
            .post('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa/start-password-reset')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send()
            .expect('Content-Type', /json/)
            .expect(404)))

      it('should succeed', () =>
        dbUtils.populateUsers(1).then(([user]) =>
          request(app)
            .post(`/api/users/${user.model.id}/start-password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send()
            .expect(204)))
    })

    describe('POST /api/users/{id}/start-email-verification', () => {
      it('should fail on no user', () =>
        dbUtils.populateUsers(1).then(([user]) =>
          request(app)
            .post('/api/users/aaa/start-email-verification')
            .set('Accept', 'application/json')
            .send({email: user.model.emails[0]})
            .expect('Content-Type', /json/)
            .expect(404)))

      it('should fail on no user', () =>
        dbUtils.populateUsers(1).then(([user]) =>
          request(app)
            .post('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa/start-email-verification')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: user.model.emails[0]})
            .expect('Content-Type', /json/)
            .expect(404)))

      it('should succeed', () =>
        dbUtils.populateUsers(1).then(([user]) =>
          request(app)
            .post(`/api/users/${user.model.id}/start-email-verification`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: user.model.emails[0]})
            .expect(204)))

      it('should succeed on crazy case', () =>
        dbUtils.populateUsers(1).then(([user]) =>
          request(app)
            .post(`/api/users/${user.model.id}/start-email-verification`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: user.model.emails[0].toUpperCase()})
            .expect(204)))

      it('should fail on wrong email', () =>
        dbUtils.populateUsers(1).then(([user]) =>
          request(app)
            .post(`/api/users/${user.model.id}/start-email-verification`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: 'not-right-' + user.model.emails[0]})
            .expect(400)))
    })

    describe('POST /api/users/{id}/password-reset', () => {
      it('should fail on no body', () =>
        dbUtils.populateUsers(2).then((users) =>
          request(app)
            .post(`/api/users/${users[0].model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({})
            .expect(400)))

      it('fail on no token', () =>
        dbUtils.populateUsers(2).then((users) =>
          request(app)
            .post(`/api/users/${users[0].model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: 'someToken', password: 'password1234'})
            .expect(400)))

      it('fail on invalid password', () =>
        dbUtils.populateUsers(1)
          .then(([user]) => user.generateResetToken().then((token) => ({user, token})))
          .then(({user, token}) =>
            request(app)
              .post(`/api/users/${user.model.id}/password-reset`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .send({token: token, password: 'pass'})
              .expect(400)))

      it('success on right token', () =>
        dbUtils.populateUsers(1)
          .then(([user]) => user.generateResetToken().then((token) => ({user, token})))
          .then(({user, token}) =>
            request(app)
              .post(`/api/users/${user.model.id}/password-reset`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .send({token: token, password: 'password1234'})
              .expect(204)))

      it('fail on no invalid id', () =>
        request(app)
          .post('/api/users/aaa/password-reset')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({token: 'asdasdasdaasdsaasd', password: 'password1'})
          .expect(404))
    })

    describe('POST /api/users/{id}/verify-email', () => {
      it('should fail on no body', () =>
        dbUtils.populateUsers(2).then((users) =>
          request(app)
            .post(`/api/users/${users[0].model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({})
            .expect(400)))

      it('fail on no token', () =>
        dbUtils.populateUsers(2).then((users) =>
          request(app)
            .post(`/api/users/${users[0].model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: 'someToken', email: users[0].model.emails[0]})
            .expect(400)))

      it('fail on invalid email', () =>
        dbUtils.populateUsers(1)
          .then(([user]) => user.generateVerifyEmailToken(user.model.emails[0]).then((token) => ({user, token})))
          .then(({user, token}) => request(app)
            .post(`/api/users/${user.model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: token, email: 'bob'})
            .expect(400)))

      it('success on right token', () =>
        dbUtils.populateUsers(1)
          .then(([user]) => user.generateVerifyEmailToken(user.model.emails[0]).then((token) => ({user, token})))
          .then(({user, token}) => request(app)
            .post(`/api/users/${user.model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: token, email: user.model.emails[0]})
            .expect(204)))

      it('success on crazy case token', () =>
        dbUtils.populateUsers(1)
          .then(([user]) => user.generateVerifyEmailToken(user.model.emails[0]).then((token) => ({user, token})))
          .then(({user, token}) => request(app)
            .post(`/api/users/${user.model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: token, email: user.model.emails[0].toUpperCase()})
            .expect(204)))

      it('fail on no invalid id', () =>
        request(app)
          .post('/api/users/aaa/verify-email')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({token: 'asdasdasdaasdsaasd', email: 'bob@bobs.dk'})
          .expect(404))
    })
    describe('DELETE /users/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/api/users/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 403 on invalid id', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .delete('/api/users/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 403 on missing id', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .delete('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 403 on other id', () =>
        dbUtils.populateTokens(1).then(({user: user1}) =>
          dbUtils.populateTokens(1).then(({user, token: token2}) =>
            request(app)
              .delete(`/api/users/${user1.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token2.secret)
              .expect(403)
              .expect('Content-Type', /json/)
              .then(res => res.body.should.deep.equal({message: 'Not allowed'})))))

      it('should succeed', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          request(app)
            .delete(`/api/users/${user.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .then(res =>
              Promise.all([UserHandler.findFromId(user.model.id), TokenHandler.findFromId(token.model.id)])
                .then((result) => result.should.be.deep.equal([undefined, undefined])))))

      it('should succeed when admin', () =>
        Promise.all([dbUtils.populateTokens(1), dbUtils.createAdministrator()])
          .then(([{user}, {user: admin, token}]) =>
            request(app)
              .delete(`/api/users/${user.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(admin.model.id, token.secret)
              .expect(204)
              .then(res =>
                UserHandler.findFromId(user.model.id)
                  .then((result) => chai.assert(!result)))))

      it('should fail on owner', () =>
        dbUtils.populateLaundries(1).then(({user, token}) =>
          request(app)
            .delete(`/api/users/${user.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(403)
            .expect('Content-Type', /json/)
            .then(res => res.body.should.deep.equal({message: 'Not allowed'}))))

      it('should succeed when only user', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          dbUtils.populateLaundries(1).then(({laundry}) =>
            laundry.addUser(user)
              .then(() =>
                request(app)
                  .delete(`/api/users/${user.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect(204)
                  .then(res => Promise
                    .all([UserHandler.findFromId(user.model.id), TokenHandler.findFromId(token.model.id)])
                    .then((result) => result.should.be.deep.equal([undefined, undefined])))))))
    })
  })
})
