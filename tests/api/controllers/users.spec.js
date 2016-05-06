var request = require('supertest')
var app = require('../../../app')
var chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()
var expect = chai.expect
var assert = chai.assert
var dbUtils = require('../../db_utils')
var _ = require('lodash')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('users', function () {
    this.timeout(20000)
    describe('GET /api/users', function () {
      it('should return an empty list', function (done) {
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
      it('should limit output size', function (done) {
        dbUtils.populateUsers(100).then((users) => {
          request(app)
            .get('/api/users')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .end(function (err, res) {
              assert(!err)
              var arr = _.slice(users, 0, 12).map((user) => user.toRest())
              res.body.forEach((user) => {
                expect(user.href).to.match(new RegExp(`\/api\/users\/${user.id}$`))
                user.href = undefined
                arr.should.include.something.that.deep.equals(user)
              })
              done()
            })
        })
      })
      it('should allow custom output size', function (done) {
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
              var arr = _.slice(users, 0, 12).map((user) => user.toRest())
              res.body.forEach((user) => {
                expect(user.href).to.match(new RegExp(`\/api\/users\/${user.id}$`))
                user.href = undefined
                arr.should.include.something.that.deep.equals(user)
              })
              arr = arr.map((u) => u.id).should.deep.equal(res.body.map((u) => u.id))
              done()
            })
        })
      })
      it('should allow since', function (done) {
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
              var u = users[56].toRest()
              res.body.forEach((user) => {
                expect(user.href).to.match(new RegExp(`\/api\/users\/${user.id}$`))
                user.href = undefined
                user.should.deep.equal(u)
              })
              done()
            })
        })
      })
      it('should allow email filter', function (done) {
        dbUtils.populateUsers(10).then((users) => {
          request(app)
            .get('/api/users')
            .query({email: users[5].model.email})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .end(function (err, res) {
              assert(!err)
              var u = users[5].toRest()
              u.href = res.body[0].href
              res.body.should.be.deep.equal([u])
              done()
            })
        })
      })
    })
  })
})
