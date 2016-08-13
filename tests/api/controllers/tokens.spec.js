const request = require('supertest')
const app = require('../../../app').app
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()
const assert = chai.assert
const {TokenHandler} = require('../../../handlers')
const dbUtils = require('../../db_utils')
const lodash = require('lodash')
const Promise = require('promise')

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
          tokens = tokens.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id))
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
    })

    describe('POST /api/tokens', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .post('/api/tokens')
          .send({name: 'Token 1'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should fail on empty name', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          request(app)
            .post('/api/tokens')
            .send({name: ' '})
            .set('Accept', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
              done(err)
            })
        })
      })
      it('should fail on duplicate name', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          request(app)
            .post('/api/tokens')
            .send({name: tokens[0].model.name})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(409)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Token already exists'})
              done()
            })
        })
      })
      it('should succeed', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          request(app)
            .post('/api/tokens')
            .send({name: tokens[0].model.name + ' 2'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err)
              const id = res.body.id
              TokenHandler.findFromId(id).then((token) => {
                token.should.not.be.undefined
                return token.toRest().then((result) => {
                  result.secret = res.body.secret
                  res.body.should.deep.equal(result)
                  done()
                })
              }).catch(done)
            })
        })
      })
    })
    describe('GET /tokens/{id}', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .get('/api/tokens/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should return 404 on invalid id', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          request(app)
            .get('/api/tokens/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Token not found'})
              done()
            })
        })
      })
      it('should return 404 on missing id', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          request(app)
            .get('/api/tokens/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Token not found'})
              done()
            })
        })
      })
      it('should return 404 on other id', (done) => {
        dbUtils.populateTokens(1).then(({tokens}) => {
          const [token1] = tokens
          dbUtils.populateTokens(1).then(({user, tokens}) => {
            const [token2] = tokens
            request(app)
              .get(`/api/tokens/${token1.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token2.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .end((err, res) => {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Token not found'})
                done()
              })
          })
        })
      })
      it('should succeed', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          request(app)
            .get(`/api/tokens/${tokens[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err)
              tokens[0].toRest().then((result) => {
                res.body.should.deep.equal(result)
                done()
              })
            })
        })
      })
    })
    describe('DELETE /tokens/{id}', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .delete('/api/tokens/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should return 404 on invalid id', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          request(app)
            .delete('/api/tokens/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Token not found'})
              done()
            })
        })
      })
      it('should return 404 on missing id', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          request(app)
            .delete('/api/tokens/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Token not found'})
              done()
            })
        })
      })
      it('should return 404 on other id', (done) => {
        dbUtils.populateTokens(1).then(({tokens}) => {
          const [token1] = tokens
          dbUtils.populateTokens(1).then(({user, tokens}) => {
            const [token2] = tokens
            request(app)
              .delete(`/api/tokens/${token1.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token2.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .end((err, res) => {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Token not found'})
                done()
              })
          })
        })
      })
      it('should succeed', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          request(app)
            .delete(`/api/tokens/${tokens[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect(204)
            .end((err, res) => {
              if (err) return done(err)
              TokenHandler
                .findFromId(tokens[0].model.id)
                .then((t) => {
                  assert(t === undefined)
                  done()
                })
            })
        })
      })
    })
  })
})
