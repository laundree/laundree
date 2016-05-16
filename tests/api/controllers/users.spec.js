var nodemailer = require('nodemailer')
var stubTransport = require('nodemailer-stub-transport')
require('../../../utils').mail.transporter = nodemailer.createTransport(stubTransport())
var request = require('supertest')
var app = require('../../../app')
var chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()

var assert = chai.assert
var dbUtils = require('../../db_utils')
var _ = require('lodash')
var UserHandler = require('../../../handlers').UserHandler

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('users', function () {
    this.timeout(20000)
    describe('GET /api/users/{id}', () => {
      it('should return error', (done) => {
        request(app)
          .get('/api/users/asd123')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function (err) {
            assert(!err)
            done()
          })
      })

      it('should return error on missing but right format', (done) => {
        request(app)
          .get('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function (err) {
            assert(!err)
            done()
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
              assert(!err)
              var u = users[5].toRest()
              res.body.should.be.deep.equal(u)
              done()
            })
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
              var arr = _.slice(users, 0, 10).map((user) => user.toRestSummary())
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
              var arr = _.slice(users, 0, 12).map((user) => user.toRestSummary())
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
      it('should fail on no user', (done) =>
        dbUtils.populateUsers(2).then((users) => {
          request(app)
            .post('/api/users/aaa/start-password-reset')
            .set('Accept', 'application/json')
            .send()
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err) => done(err))
        }))

      it('should fail on no user', (done) =>
        dbUtils.populateUsers(2).then((users) => {
          request(app)
            .post('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa/start-password-reset')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send()
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err) => done(err))
        }))

      it('should succeed', (done) =>
        dbUtils.populateUsers(1).then((users) => {
          var [user] = users
          request(app)
            .post(`/api/users/${user.model.id}/start-password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send()
            .expect(204)
            .end(done)
        }))
    })

    describe('POST /api/users/{id}/start-email-verification', () => {
      it('should fail on no user', (done) =>
        dbUtils.populateUsers(1).then((users) => {
          var [user] = users
          request(app)
            .post('/api/users/aaa/start-email-verification')
            .set('Accept', 'application/json')
            .send({email: user.model.emails[0]})
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err) => done(err))
        }))

      it('should fail on no user', (done) =>
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
        }))

      it('should succeed', (done) =>
        dbUtils.populateUsers(1).then((users) => {
          var [user] = users
          request(app)
            .post(`/api/users/${user.model.id}/start-email-verification`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: user.model.emails[0]})
            .expect(204)
            .end(done)
        }))
      it('should fail on wrong email', (done) =>
        dbUtils.populateUsers(1).then((users) => {
          var [user] = users
          request(app)
            .post(`/api/users/${user.model.id}/start-email-verification`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: 'not-right-' + user.model.emails[0]})
            .expect(400)
            .end(done)
        }))
    })

    describe('POST /api/users/{id}/password-reset', () => {
      it('should fail on no body', (done) =>
        dbUtils.populateUsers(2).then((users) => {
          request(app)
            .post(`/api/users/${users[0].model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({})
            .expect(400)
            .end((err) => done(err))
        }))

      it('fail on no token', (done) =>
        dbUtils.populateUsers(2).then((users) => {
          request(app)
            .post(`/api/users/${users[0].model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: 'someToken', password: 'password1234'})
            .expect(400)
            .end((err) => done(err))
        }))

      it('fail on invalid password', (done) =>
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
        }))
      it('success on right token', (done) =>
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
        }))

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
      it('should fail on no body', (done) =>
        dbUtils.populateUsers(2).then((users) => {
          request(app)
            .post(`/api/users/${users[0].model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({})
            .expect(400)
            .end((err) => done(err))
        }))

      it('fail on no token', (done) =>
        dbUtils.populateUsers(2).then((users) => {
          request(app)
            .post(`/api/users/${users[0].model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: 'someToken', email: users[0].model.emails[0]})
            .expect(400)
            .end((err) => done(err))
        }))
      it('fail on invalid email', (done) =>
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
        }))
      it('success on right token', (done) =>
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
        }))

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
  })
})
