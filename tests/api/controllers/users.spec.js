var request = require('supertest')
var app = require('../../../app').app
var chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()

var assert = chai.assert
var dbUtils = require('../../db_utils')
const {UserHandler, TokenHandler} = require('../../../handlers')
const Promise = require('promise')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('users', function () {
    this.timeout(5000)
    describe('GET /api/users/{id}', () => {
      it('should fail on auth', (done) => {
        request(app)
          .get('/api/users/asd123')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .end(function (err) {
            done(err)
          })
      })

      it('should return error', (done) => {
        request(app)
          .get('/api/users/asd123')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function (err) {
            done(err)
          })
      })

      it('should return error on missing but right format', (done) => {
        request(app)
          .get('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function (err) {
            done(err)
          })
      })
      it('should find user', (done) => {
        dbUtils.populateUsers(10).then((users) => {
          request(app)
            .get(`/api/users/${users[5].model.id}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err)
              users[5].toRest()
                .then((u) => {
                  const cleanUser = Object.keys(u).filter(k => u[k] !== undefined).reduce((o, k) => {
                    o[k] = u[k]
                    return o
                  }, {})
                  res.body.should.be.deep.equal(cleanUser)
                  done()
                })
                .catch(done)
            })
        })
      })
    })
    describe('PUT /api/users/{id}', () => {
      it('should fail on auth', (done) => {
        request(app)
          .put('/api/users/asd123')
          .send({name: 'Kurt Frandsen'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end(function (err) {
            done(err)
          })
      })

      it('should return error on missing but right format', (done) => {
        dbUtils
          .populateTokens(1)
          .then(({token, user}) => {
            request(app)
              .put('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa')
              .send({name: 'Kurt Frandsen'})
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(404)
              .end(err => done(err))
          })
      })
      it('should update user', (done) => {
        dbUtils.populateTokens(1).then(({user, token}) => {
          request(app)
            .put(`/api/users/${user.model.id}`)
            .auth(user.model.id, token.secret)
            .send({name: 'Kurt Frandsen'})
            .set('Accept', 'application/json')
            .expect(204)
            .end(function (err, res) {
              if (err) return done(err)
              return UserHandler.find({_id: user.model._id})
                .then(([user]) => {
                  user.model.displayName.should.equal('Kurt Frandsen')
                })
                .then(() => done(), done)
            })
        })
      })
      it('should not update user', (done) => {
        Promise
          .all([
            dbUtils.populateTokens(1),
            dbUtils.populateTokens(1)
          ])
          .then(([{user: user1, token}, {user: user2}]) => {
            request(app)
              .put(`/api/users/${user2.model.id}`)
              .auth(user1.model.id, token.secret)
              .send({name: 'Kurt Frandsen'})
              .set('Accept', 'application/json')
              .expect(403)
              .end(err => done(err))
          })
      })
    })

    describe('POST /api/users/{id}/password-change', () => {
      it('should fail on auth', (done) => {
        request(app)
          .post('/api/users/asd123/password-change')
          .send({currentPassword: 'password', newPassword: 'password'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end(function (err) {
            done(err)
          })
      })

      it('should return error on missing but right format', (done) => {
        dbUtils
          .populateTokens(1)
          .then(({token, user}) => {
            request(app)
              .post('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa/password-change')
              .send({currentPassword: 'password', newPassword: 'password'})
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(404)
              .end(err => done(err))
          })
      })
      it('should update user', (done) => {
        dbUtils.populateTokens(1).then(({user, token}) => {
          user
            .resetPassword('password')
            .then(() => {
              request(app)
                .post(`/api/users/${user.model.id}/password-change`)
                .auth(user.model.id, token.secret)
                .send({currentPassword: 'password', newPassword: 'password2'})
                .set('Accept', 'application/json')
                .expect(204)
                .end(function (err, res) {
                  if (err) return done(err)
                  return UserHandler
                    .find({_id: user.model._id})
                    .then(([user]) => {
                      return user
                        .verifyPassword('password2')
                        .then(r => Boolean(r))
                        .should
                        .eventually.be.true
                    })
                    .then(() => done(), done)
                })
            })
        })
      })
      it('should update user when no current password', (done) => {
        dbUtils.populateTokens(1).then(({user, token}) => {
          request(app)
            .post(`/api/users/${user.model.id}/password-change`)
            .auth(user.model.id, token.secret)
            .send({currentPassword: 'password', newPassword: 'password2'})
            .set('Accept', 'application/json')
            .expect(204)
            .end(function (err, res) {
              if (err) return done(err)
              return UserHandler
                .find({_id: user.model._id})
                .then(([user]) => {
                  return user
                    .verifyPassword('password2')
                    .then(r => Boolean(r))
                    .should
                    .eventually.be.true
                })
                .then(() => done(), done)
            })
        })
      })
      it('should fail with invalid input', (done) => {
        dbUtils.populateTokens(1).then(({user, token}) => {
          request(app)
            .post(`/api/users/${user.model.id}/password-change`)
            .auth(user.model.id, token.secret)
            .send({currentPassword: 'p', newPassword: 'p2'})
            .set('Accept', 'application/json')
            .expect(400)
            .end(err => done(err))
        })
      })
      it('should fail with wrong current password', (done) => {
        dbUtils.populateTokens(1).then(({user, token}) => {
          user
            .resetPassword('password')
            .then(() => {
              request(app)
                .post(`/api/users/${user.model.id}/password-change`)
                .auth(user.model.id, token.secret)
                .send({currentPassword: 'password1', newPassword: 'password2'})
                .set('Accept', 'application/json')
                .expect(403)
                .end(err => done(err))
            })
        })
      })
      it('should not update user', (done) => {
        Promise
          .all([
            dbUtils.populateTokens(1),
            dbUtils.populateTokens(1)
          ])
          .then(([{user: user1, token}, {user: user2}]) => {
            request(app)
              .post(`/api/users/${user2.model.id}/password-change`)
              .auth(user1.model.id, token.secret)
              .send({currentPassword: 'password', newPassword: 'password'})
              .set('Accept', 'application/json')
              .expect(403)
              .end(err => done(err))
          })
      })
    })

    describe('GET /api/users', () => {
      it('should return an empty list', (done) => {
        request(app)
          .get('/api/users')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
          .expect(200)
          .end(function (err, res) {
            // noinspection BadExpressionStatementJS
            assert(!err)
            res.body.should.deep.equal([])
            done()
          })
      })
      it('should limit output size', (done) => {
        dbUtils.populateUsers(100).then((users) => {
          request(app)
            .get('/api/users')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .end(function (err, res) {
              assert(!err)
              var arr = users.slice(0, 10).map((user) => user.toRestSummary())
              res.body.should.deep.equal(arr)
              done()
            })
        })
      })
      it('should allow custom output size', (done) => {
        dbUtils.populateUsers(100).then((users) => {
          request(app)
            .get('/api/users')
            .query({page_size: 12})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .end(function (err, res) {
              assert(!err)
              var arr = users.slice(0, 12).map((user) => user.toRestSummary())
              res.body.should.deep.equal(arr)
              done()
            })
        })
      })
      it('should allow since', (done) => {
        dbUtils.populateUsers(100).then((users) => {
          request(app)
            .get('/api/users')
            .query({since: users[55].model.id, page_size: 1})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .end(function (err, res) {
              assert(!err)
              res.body.should.deep.equal([users[56].toRestSummary()])
              done()
            })
        })
      })
      it('should allow email filter', (done) => {
        dbUtils.populateUsers(10).then((users) => {
          request(app)
            .get('/api/users')
            .query({email: users[5].model.emails[0]})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .end(function (err, res) {
              assert(!err)
              res.body.should.be.deep.equal([users[5].toRestSummary()])
              done()
            })
        })
      })
    })

    describe('POST /api/users', () => {
      it('should succede with right body', (done) => {
        request(app)
          .post('/api/users')
          .send({displayName: 'Bob Bobbesen', email: 'bob@example.com', password: 'password1234'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(() => {
            UserHandler.findFromEmail('bob@example.com').then((u) => {
              u.should.not.be.undefined
              done()
            })
          })
      })
      it('should fail on invalid email in body', (done) => {
        request(app)
          .post('/api/users')
          .send({displayName: 'Bob Bobbesen', email: 'invalid', password: 'password1234'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
          .end(() => {
            done()
          })
      })
      it('should fail on invalid name in body', (done) => {
        request(app)
          .post('/api/users')
          .send({displayName: '', email: 'a@example.com', password: 'password1234'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
          .end(() => {
            done()
          })
      })
      it('should fail on invalid password in body', (done) => {
        request(app)
          .post('/api/users')
          .send({displayName: 'Bob', email: 'a@example.com', password: 'asdfg'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
          .end(() => {
            done()
          })
      })
    })

    describe('POST /api/users/{id}/start-password-reset', () => {
      it('should fail on no user', (done) => {
        dbUtils.populateUsers(2).then(() => {
          request(app)
            .post('/api/users/aaa/start-password-reset')
            .set('Accept', 'application/json')
            .send()
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err) => done(err))
        })
      })

      it('should fail on no user', (done) => {
        dbUtils.populateUsers(2).then((users) => {
          request(app)
            .post('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa/start-password-reset')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send()
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err) => done(err))
        })
      })

      it('should succeed', (done) => {
        dbUtils.populateUsers(1).then((users) => {
          var [user] = users
          request(app)
            .post(`/api/users/${user.model.id}/start-password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send()
            .expect(204)
            .end(done)
        })
      })
    })

    describe('POST /api/users/{id}/start-email-verification', () => {
      it('should fail on no user', (done) => {
        dbUtils.populateUsers(1).then((users) => {
          var [user] = users
          request(app)
            .post('/api/users/aaa/start-email-verification')
            .set('Accept', 'application/json')
            .send({email: user.model.emails[0]})
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err) => done(err))
        })
      })

      it('should fail on no user', (done) => {
        dbUtils.populateUsers(1).then((users) => {
          var [user] = users
          request(app)
            .post('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa/start-email-verification')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: user.model.emails[0]})
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err) => done(err))
        })
      })

      it('should succeed', (done) => {
        dbUtils.populateUsers(1).then((users) => {
          var [user] = users
          request(app)
            .post(`/api/users/${user.model.id}/start-email-verification`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: user.model.emails[0]})
            .expect(204)
            .end(done)
        })
      })
      it('should succeed on crazy case', (done) => {
        dbUtils.populateUsers(1).then((users) => {
          var [user] = users
          request(app)
            .post(`/api/users/${user.model.id}/start-email-verification`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: user.model.emails[0].toUpperCase()})
            .expect(204)
            .end(done)
        })
      })
      it('should fail on wrong email', (done) => {
        dbUtils.populateUsers(1).then((users) => {
          var [user] = users
          request(app)
            .post(`/api/users/${user.model.id}/start-email-verification`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: 'not-right-' + user.model.emails[0]})
            .expect(400)
            .end(done)
        })
      })
    })

    describe('POST /api/users/{id}/password-reset', () => {
      it('should fail on no body', (done) => {
        dbUtils.populateUsers(2).then((users) => {
          request(app)
            .post(`/api/users/${users[0].model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({})
            .expect(400)
            .end((err) => done(err))
        })
      })

      it('fail on no token', (done) => {
        dbUtils.populateUsers(2).then((users) => {
          request(app)
            .post(`/api/users/${users[0].model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: 'someToken', password: 'password1234'})
            .expect(400)
            .end((err) => done(err))
        })
      })

      it('fail on invalid password', (done) => {
        dbUtils.populateUsers(1).then((users) => {
          var user = users[0]
          return user.generateResetToken().then((token) => [user, token])
        }).then((result) => {
          // noinspection UnnecessaryLocalVariableJS
          var [user, token] = result
          request(app)
            .post(`/api/users/${user.model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: token, password: 'pass'})
            .expect(400)
            .end((err) => done(err))
        })
      })
      it('success on right token', (done) => {
        dbUtils.populateUsers(1).then((users) => {
          var user = users[0]
          return user.generateResetToken().then((token) => [user, token])
        }).then((result) => {
          // noinspection UnnecessaryLocalVariableJS
          var [user, token] = result
          request(app)
            .post(`/api/users/${user.model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: token, password: 'password1234'})
            .expect(204)
            .end((err) => done(err))
        })
      })

      it('fail on no invalid id', (done) => {
        request(app)
          .post('/api/users/aaa/password-reset')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({token: 'asdasdasdaasdsaasd', password: 'password1'})
          .expect(404)
          .end((err) => done(err))
      })
    })

    describe('POST /api/users/{id}/verify-email', () => {
      it('should fail on no body', (done) => {
        dbUtils.populateUsers(2).then((users) => {
          request(app)
            .post(`/api/users/${users[0].model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({})
            .expect(400)
            .end((err) => done(err))
        })
      })

      it('fail on no token', (done) => {
        dbUtils.populateUsers(2).then((users) => {
          request(app)
            .post(`/api/users/${users[0].model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: 'someToken', email: users[0].model.emails[0]})
            .expect(400)
            .end((err) => done(err))
        })
      })
      it('fail on invalid email', (done) => {
        dbUtils.populateUsers(1).then((users) => {
          var user = users[0]
          return user.generateVerifyEmailToken(user.model.emails[0]).then((token) => [user, token])
        }).then((result) => {
          // noinspection UnnecessaryLocalVariableJS
          var [user, token] = result
          request(app)
            .post(`/api/users/${user.model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: token, email: 'bob'})
            .expect(400)
            .end((err) => done(err))
        })
      })
      it('success on right token', (done) => {
        dbUtils.populateUsers(1).then((users) => {
          var user = users[0]
          return user.generateVerifyEmailToken(user.model.emails[0]).then((token) => [user, token])
        }).then((result) => {
          // noinspection UnnecessaryLocalVariableJS
          var [user, token] = result
          request(app)
            .post(`/api/users/${user.model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: token, email: user.model.emails[0]})
            .expect(204)
            .end((err) => done(err))
        })
      })
      it('success on crazy case token', (done) => {
        dbUtils.populateUsers(1).then((users) => {
          var user = users[0]
          return user.generateVerifyEmailToken(user.model.emails[0]).then((token) => [user, token])
        }).then((result) => {
          // noinspection UnnecessaryLocalVariableJS
          var [user, token] = result
          request(app)
            .post(`/api/users/${user.model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: token, email: user.model.emails[0].toUpperCase()})
            .expect(204)
            .end((err) => done(err))
        })
      })

      it('fail on no invalid id', (done) => {
        request(app)
          .post('/api/users/aaa/verify-email')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({token: 'asdasdasdaasdsaasd', email: 'bob@bobs.dk'})
          .expect(404)
          .end((err) => done(err))
      })
    })
    describe('DELETE /users/{id}', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .delete('/api/users/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should return 404 on invalid id', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          request(app)
            .delete('/api/users/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'User not found'})
              done()
            })
        })
      })
      it('should return 404 on missing id', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          request(app)
            .delete('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'User not found'})
              done()
            })
        })
      })
      it('should return 403 on other id', (done) => {
        dbUtils.populateTokens(1).then(({user}) => {
          const user1 = user
          dbUtils.populateTokens(1).then(({user, tokens}) => {
            const [token2] = tokens
            request(app)
              .delete(`/api/users/${user1.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token2.secret)
              .expect(403)
              .expect('Content-Type', /json/)
              .end((err, res) => {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Not allowed'})
                done()
              })
          })
        })
      })
      it('should succeed', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          request(app)
            .delete(`/api/users/${user.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect(204)
            .end((err, res) => {
              if (err) return done(err)
              Promise.all([UserHandler.findFromId(user.model.id), TokenHandler.findFromId(tokens[0].model.id)])
                .then((result) => {
                  result.should.be.deep.equal([undefined, undefined])
                  done()
                })
                .catch(done)
            })
        })
      })
      it('should fail on owner', (done) => {
        dbUtils.populateLaundries(1).then(({user, token}) => {
          request(app)
            .delete(`/api/users/${user.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(403)
            .expect('Content-Type', /json/)
            .end((err, res) => {
              if (err) done(err)
              res.body.should.deep.equal({message: 'Not allowed'})
              done()
            })
        })
      })
      it('should succeed when only user', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          const [token] = tokens
          return dbUtils.populateLaundries(1).then(({laundry}) => {
            return laundry.addUser(user)
              .then(() => {
                request(app)
                  .delete(`/api/users/${user.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect(204)
                  .end((err, res) => {
                    if (err) return done(err)
                    Promise.all([UserHandler.findFromId(user.model.id), TokenHandler.findFromId(token.model.id)])
                      .then((result) => {
                        result.should.be.deep.equal([undefined, undefined])
                        done()
                      })
                      .catch(done)
                  })
              })
          })
        }).catch(done)
      })
    })
  })
})
