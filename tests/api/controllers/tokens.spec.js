const request = require('supertest')
const app = require('../../../app')
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()

const dbUtils = require('../../db_utils')
const lodash = require('lodash')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('tokens', function () {
    this.timeout(5000)
    describe('GET /api/tokens', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .get('/api/tokens')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should limit output size', (done) => {
        dbUtils.populateTokens(50).then(({user, tokens}) => {
          request(app)
            .get('/api/tokens')
            .set('Accept', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err)
              var arr = lodash.slice(tokens.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)), 0, 10).map((token) => token.toRestSummary())
              res.body.should.deep.equal(arr)
              done()
            })
        })
      })
      it('should allow custom output size', (done) => {
        dbUtils.populateTokens(50).then(({user, tokens}) => {
          request(app)
            .get('/api/tokens')
            .query({page_size: 12})
            .auth(user.model.id, tokens[0].secret)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err)
              var arr = lodash.slice(tokens.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)), 0, 12).map((token) => token.toRestSummary())
              res.body.should.deep.equal(arr)
              done()
            })
        })
      })
      it('should only fetch from current user', (done) => {
        Promise.all([dbUtils.populateTokens(1), dbUtils.populateTokens(2)])
          .then(([r1, r2]) => {
            const {user, tokens} = r2
            request(app)
              .get('/api/tokens')
              .auth(user.model.id, tokens[0].secret)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect('Link', /rel=.first./)
              .expect(200)
              .end(function (err, res) {
                if (err) return done(err)
                var arr = tokens.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map((token) => token.toRestSummary())
                res.body.should.deep.equal(arr)
                done()
              })
          })
      })
      it('should allow since', (done) => {
        dbUtils.populateTokens(50).then(({user, tokens}) => {
          request(app)
            .get('/api/tokens')
            .query({since: tokens[24].model.id, page_size: 1})
            .auth(user.model.id, tokens[0].secret)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err)
              res.body.should.deep.equal([tokens[25].toRestSummary()])
              done()
            })
        })
      })
      // TODO test not logged in and tokens of other tokens
    })
  })
})
