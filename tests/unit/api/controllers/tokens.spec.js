const request = require('supertest-as-promised')
const app = require('../../../../app').app
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()
const assert = chai.assert
const {TokenHandler} = require('../../../../handlers')
const dbUtils = require('../../../db_utils')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('tokens', function () {
    this.timeout(5000)
    describe('GET /api/tokens', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .get('/api/tokens')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))
      it('should limit output size', () =>
        dbUtils.populateTokens(50).then(({user, tokens}) =>
          request(app)
            .get('/api/tokens')
            .set('Accept', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => {
              const arr = tokens.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).slice(0, 10).map((token) => token.toRestSummary())
              res.body.should.deep.equal(arr)
            })))

      it('should allow custom output size', () =>
        dbUtils.populateTokens(50).then(({user, tokens}) =>
          request(app)
            .get('/api/tokens')
            .query({page_size: 12})
            .auth(user.model.id, tokens[0].secret)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => {
              const arr = tokens.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).slice(0, 12).map((token) => token.toRestSummary())
              res.body.should.deep.equal(arr)
            })))

      it('should only fetch from current user', () =>
        Promise.all([dbUtils.populateTokens(1), dbUtils.populateTokens(2)])
          .then(([r1, {user, tokens}]) =>
            request(app)
              .get('/api/tokens')
              .auth(user.model.id, tokens[0].secret)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect('Link', /rel=.first./)
              .expect(200)
              .then(res => {
                const arr = tokens.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map((token) => token.toRestSummary())
                res.body.should.deep.equal(arr)
              })))

      it('should allow since', () =>
        dbUtils.populateTokens(50).then(({user, tokens}) => {
          tokens = tokens.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id))
          return request(app)
            .get('/api/tokens')
            .query({since: tokens[24].model.id, page_size: 1})
            .auth(user.model.id, tokens[0].secret)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => res.body.should.deep.equal([tokens[25].toRestSummary()]))
        }))
    })

    describe('POST /api/tokens', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .post('/api/tokens')
          .send({name: 'Token 1'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should fail on empty name', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .post('/api/tokens')
            .send({name: ' '})
            .set('Accept', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(400)))

      it('should fail on duplicate name', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .post('/api/tokens')
            .send({name: tokens[0].model.name})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(409)
            .then(res => res.body.should.deep.equal({message: 'Token already exists'}))))

      it('should succeed', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .post('/api/tokens')
            .send({name: tokens[0].model.name + ' 2'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
              const id = res.body.id
              return TokenHandler.findFromId(id).then((token) => {
                token.should.not.be.undefined
                return token.toRest().then((result) => {
                  result.secret = res.body.secret
                  res.body.should.deep.equal(result)
                })
              })
            })))
    })
    describe('GET /tokens/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .get('/api/tokens/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .get('/api/tokens/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .get('/api/tokens/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on other id', () =>
        dbUtils.populateTokens(1).then(({tokens}) => {
          const [token1] = tokens
          return dbUtils.populateTokens(1).then(({user, tokens}) => {
            const [token2] = tokens
            return request(app)
              .get(`/api/tokens/${token1.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token2.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .then(res => res.body.should.deep.equal({message: 'Not found'}))
          })
        }))

      it('should succeed', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .get(`/api/tokens/${tokens[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res =>
              tokens[0].toRest().then((result) => res.body.should.deep.equal(result)))))
    })
    describe('DELETE /tokens/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/api/tokens/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .delete('/api/tokens/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))
      it('should return 404 on missing id', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .delete('/api/tokens/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on other id', () =>
        dbUtils.populateTokens(1).then(({token: token1}) =>
          dbUtils.populateTokens(1).then(({user, token: token2}) => request(app)
            .delete(`/api/tokens/${token1.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token2.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'})))))

      it('should succeed', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .delete(`/api/tokens/${tokens[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect(204)
            .then(res =>
              TokenHandler
                .findFromId(tokens[0].model.id)
                .then((t) => assert(t === undefined)))))
    })
  })
})
