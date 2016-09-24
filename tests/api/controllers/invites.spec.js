const request = require('supertest')
const app = require('../../../app').app
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()
const assert = chai.assert
const {LaundryInvitationHandler} = require('../../../handlers')
const dbUtils = require('../../db_utils')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('invites', function () {
    this.timeout(5000)
    describe('GET /invites/{id}', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .get('/api/invites/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should return 404 on invalid id', (done) => {
        dbUtils.populateInvites(1).then(({user, token}) => {
          request(app)
            .get('/api/invites/idæø')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Not found'})
              done()
            })
        }).catch(done)
      })
      it('should return 404 on missing id', (done) => {
        dbUtils.populateInvites(1).then(({user, token}) => {
          request(app)
            .get('/api/invites/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Not found'})
              done()
            })
        }).catch(done)
      })
      it('should return 404 on other id', (done) => {
        dbUtils.populateInvites(1).then(({invite, laundry}) => {
          dbUtils.populateInvites(1).then(({user, token}) => {
            request(app)
              .get(`/api/invites/${invite.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .end((err, res) => {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Not found'})
                done()
              })
          }).catch(done)
        }).catch(done)
      })
      it('should succeed', (done) => {
        dbUtils.populateInvites(1).then(({user, token, invite}) => {
          request(app)
            .get(`/api/invites/${invite.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err)
              invite.toRest().then((result) => {
                res.body.should.deep.equal(result)
                done()
              })
            })
        }).catch(done)
      })
      it('should fail when only user', (done) => {
        dbUtils.populateTokens(1).then(({user, token}) => {
          return dbUtils.populateInvites(1).then(({invite, laundry}) => {
            return laundry.addUser(user)
              .then(() => {
                request(app)
                  .get(`/api/invites/${invite.model.id}`)
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
        }).catch(done)
      })
    })
    describe('DELETE /invites/{id}', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .delete('/api/invites/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should return 404 on invalid id', (done) => {
        dbUtils.populateInvites(1).then(({user, token}) => {
          request(app)
            .delete('/api/invites/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Not found'})
              done()
            })
        })
      })
      it('should return 404 on other id', (done) => {
        dbUtils.populateInvites(1).then(({invite}) => {
          dbUtils.populateInvites(1).then(({user, token}) => {
            request(app)
              .delete(`/api/invites/${invite.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .end((err, res) => {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Not found'})
                done()
              })
          }).catch(done)
        }).catch(done)
      })
      it('should succeed', (done) => {
        dbUtils.populateInvites(1).then(({user, token, invite}) => {
          request(app)
            .delete(`/api/invites/${invite.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .end((err, res) => {
              if (err) return done(err)
              LaundryInvitationHandler
                .findFromId(invite.model.id)
                .then((t) => {
                  assert(t === undefined)
                  done()
                }).catch(done)
            })
        }).catch(done)
      })
      it('should fail when other user', (done) => {
        dbUtils.populateTokens(1).then(({user, token}) => {
          return dbUtils.populateInvites(1).then(({invite, laundry}) => {
            return laundry.addUser(user)
              .then(() => {
                request(app)
                  .delete(`/api/invites/${invite.model.id}`)
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
        }).catch(done)
      })
    })
  })
})
