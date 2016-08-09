const request = require('supertest')
const app = require('../../../app')
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()
const assert = chai.assert
const {LaundryHandler, LaundryInvitationHandler} = require('../../../handlers')
const dbUtils = require('../../db_utils')
const lodash = require('lodash')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('laundries', function () {
    this.timeout(5000)
    describe('GET /api/laundries', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .get('/api/laundries')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should limit output size', (done) => {
        dbUtils.populateLaundries(50).then(({user, token, laundries}) => {
          request(app)
            .get('/api/laundries')
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err)
              var arr = lodash.slice(laundries.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)), 0, 10).map((token) => token.toRestSummary())
              res.body.should.deep.equal(arr)
              done()
            })
        })
      })
      it('should allow custom output size', (done) => {
        dbUtils.populateLaundries(50).then(({user, token, laundries}) => {
          request(app)
            .get('/api/laundries')
            .query({page_size: 12})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err)
              var arr = lodash.slice(laundries.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)), 0, 12).map((laundry) => laundry.toRestSummary())
              res.body.should.deep.equal(arr)
              done()
            })
        })
      })
      it('should only fetch from current user', (done) => {
        Promise.all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(2)])
          .then(([r1, r2]) => {
            const {user, token, laundries} = r2
            request(app)
              .get('/api/laundries')
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect('Link', /rel=.first./)
              .expect(200)
              .end(function (err, res) {
                if (err) return done(err)
                var arr = laundries.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map((laundry) => laundry.toRestSummary())
                res.body.should.deep.equal(arr)
                done()
              })
          })
      })
      it('should allow since', (done) => {
        dbUtils.populateLaundries(50).then(({user, token, laundries}) => {
          laundries = laundries.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id))
          request(app)
            .get('/api/laundries')
            .query({since: laundries[24].model.id, page_size: 1})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err)
              res.body.should.deep.equal([laundries[25].toRestSummary()])
              done()
            })
        })
      })
    })

    describe('POST /api/laundries', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .post('/api/laundries')
          .send({name: 'Laundry 1'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })

      it('should fail on empty name', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundries}) => {
          request(app)
            .post('/api/laundries')
            .send({name: ' '})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
              done(err)
            })
        })
      })
      it('should fail on duplicate name', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundries}) => {
          request(app)
            .post('/api/laundries')
            .send({name: laundries[0].model.name})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(409)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Laundry already exists'})
              done()
            })
        })
      })
      it('should succeed', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundries}) => {
          request(app)
            .post('/api/laundries')
            .send({name: laundries[0].model.name + ' 2'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err)
              const id = res.body.id
              LaundryHandler.findFromId(id).then((laundry) => {
                laundry.should.not.be.undefined
                return laundry.toRest().then((result) => {
                  res.body.should.deep.equal(result)
                  done()
                })
              }).catch(done)
            })
        })
      })
    })

    describe('GET /laundries/{id}', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .get('/api/laundries/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should return 404 on invalid id', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundries}) => {
          request(app)
            .get('/api/laundries/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Laundry not found'})
              done()
            })
        })
      })
      it('should return 404 on missing id', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundries}) => {
          request(app)
            .get('/api/laundries/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Laundry not found'})
              done()
            })
        })
      })
      it('should return 404 on other id', (done) => {
        dbUtils.populateLaundries(1).then(({laundries}) => {
          const [laundry1] = laundries
          dbUtils.populateLaundries(1).then(({user, token}) => {
            request(app)
              .get(`/api/laundries/${laundry1.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .end((err, res) => {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Laundry not found'})
                done()
              })
          })
        })
      })
      it('should succeed', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundries}) => {
          request(app)
            .get(`/api/laundries/${laundries[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err)
              laundries[0].toRest().then((result) => {
                res.body.should.deep.equal(result)
                done()
              })
            })
        })
      })
      it('should succeed when only user', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          const [token] = tokens
          return dbUtils.populateLaundries(1).then(({laundries}) => {
            const [laundry] = laundries
            return user.addLaundry(laundry)
              .then(() => {
                request(app)
                  .get(`/api/laundries/${laundries[0].model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect('Content-Type', /json/)
                  .expect(200)
                  .end((err, res) => {
                    if (err) return done(err)
                    laundry.toRest().then((result) => {
                      res.body.should.deep.equal(result)
                      done()
                    })
                  })
              })
          })
        })
      })
    })
    describe('POST /laundries/{id}/invite-by-email', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .post('/api/laundries/id/invite-by-email')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should return 404 on invalid id', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundries}) => {
          request(app)
            .post('/api/laundries/id/invite-by-email')
            .send({email: 'alice@example.com'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Laundry not found'})
              done()
            })
        })
      })
      it('should return 404 on missing id', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundries}) => {
          request(app)
            .post('/api/laundries/id/invite-by-email')
            .send({email: 'alice@example.com'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Laundry not found'})
              done()
            })
        })
      })
      it('should return 404 on other id', (done) => {
        dbUtils.populateLaundries(1).then(({laundries}) => {
          const [laundry] = laundries
          dbUtils.populateLaundries(1).then(({user, token}) => {
            request(app)
              .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
              .send({email: 'alice@example.com'})
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .end((err, res) => {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Laundry not found'})
                done()
              })
          })
        })
      })
      it('should succeed', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundry}) => {
          request(app)
            .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
            .send({email: 'alice@example.com'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .end((err, res) => done(err))
        })
      })
      it('should create invitation', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundry}) => {
          request(app)
            .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
            .send({email: 'alice@example.com'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .end((err, res) => {
              if (err) return done(err)
              LaundryInvitationHandler
                .find({email: 'alice@example.com', laundry: laundry.model._id})
                .then(([invitation]) => {
                  chai.assert(invitation !== undefined, 'Invitation should not be undefined.')
                  done()
                }).catch(done)
            })
        })
      })
      // TODO add more happy paths
      it('should fail when only user', (done) => {
        dbUtils.populateTokens(1)
          .then(({user, token}) => {
            return dbUtils
              .populateLaundries(1)
              .then(({laundry}) => {
                return user
                  .addLaundry(laundry)
                  .then(() => {
                    request(app)
                      .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
                      .send({email: 'alice@example.com'})
                      .set('Accept', 'application/json')
                      .set('Content-Type', 'application/json')
                      .auth(user.model.id, token.secret)
                      .expect('Content-Type', /json/)
                      .expect(403)
                      .end((err, res) => {
                        if (err) return done(err)
                        res.body.should.deep.equal({message: 'Not allowed'})
                        done()
                      })
                  })
              })
          })
          .catch(done)
      })
    })
    describe('DELETE /laundries/{id}', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .delete('/api/laundries/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should return 404 on invalid id', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundries}) => {
          request(app)
            .delete('/api/laundries/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Laundry not found'})
              done()
            })
        })
      })
      it('should return 404 on missing id', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundries}) => {
          request(app)
            .delete('/api/laundries/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Laundry not found'})
              done()
            })
        })
      })
      it('should return 404 on other id', (done) => {
        dbUtils.populateLaundries(1).then(({laundries}) => {
          const [laundry] = laundries
          dbUtils.populateLaundries(1).then(({user, token}) => {
            request(app)
              .delete(`/api/laundries/${laundry.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .end((err, res) => {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Laundry not found'})
                done()
              })
          })
        })
      })
      it('should succeed', (done) => {
        dbUtils.populateLaundries(1).then(({user, token, laundries}) => {
          request(app)
            .delete(`/api/laundries/${laundries[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .end((err, res) => {
              if (err) return done(err)
              LaundryHandler
                .findFromId(laundries[0].model.id)
                .then((t) => {
                  assert(t === undefined)
                  done()
                })
            })
        })
      })
      it('should fail when only user', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          const [token] = tokens
          return dbUtils.populateLaundries(1).then(({laundries}) => {
            const [laundry] = laundries
            return user.addLaundry(laundry)
              .then(() => {
                request(app)
                  .delete(`/api/laundries/${laundries[0].model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect('Content-Type', /json/)
                  .expect(403)
                  .end((err, res) => {
                    if (err) return done(err)
                    res.body.should.deep.equal({message: 'Not allowed'})
                    done()
                  })
              })
          })
        })
      })
    })
  })
})
