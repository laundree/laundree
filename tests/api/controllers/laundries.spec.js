const request = require('supertest')
const app = require('../../../app').app
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()
const assert = chai.assert
const {LaundryHandler, LaundryInvitationHandler, UserHandler} = require('../../../handlers')
const dbUtils = require('../../db_utils')
const Promise = require('promise')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('laundries', function () {
    this.timeout(5000)
    describe('GET /api/laundries', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .get('/api/laundries')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should limit output size', () =>
        dbUtils.populateLaundries(50).then(({user, token, laundries}) =>
          request(app)
            .get('/api/laundries')
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => {
              var arr = laundries.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)).slice(0, 10).map((token) => token.toRestSummary())
              res.body.should.deep.equal(arr)
            })))
      it('should allow custom output size', () =>
        dbUtils.populateLaundries(50).then(({user, token, laundries}) =>
          request(app)
            .get('/api/laundries')
            .query({page_size: 12})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => {
              var arr = laundries.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).slice(0, 12).map((laundry) => laundry.toRestSummary())
              res.body.should.deep.equal(arr)
            })))

      it('should only fetch from current user', () =>
        Promise.all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(2)])
          .then(([ r1, {user, token, laundries} ]) =>
            request(app)
              .get('/api/laundries')
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect('Link', /rel=.first./)
              .expect(200)
              .then(res => {
                var arr = laundries.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map((laundry) => laundry.toRestSummary())
                res.body.should.deep.equal(arr)
              })))

      it('should allow since', () =>
        dbUtils.populateLaundries(50).then(({user, token, laundries}) => {
          laundries = laundries.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id))
          return request(app)
            .get('/api/laundries')
            .query({since: laundries[24].model.id, page_size: 1})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => res.body.should.deep.equal([laundries[25].toRestSummary()]))
        }))
    })

    describe('POST /api/laundries', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .post('/api/laundries')
          .send({name: 'Laundry 1'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should fail on empty name', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .post('/api/laundries')
            .send({name: ' '})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)))

      it('should fail on duplicate name', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .post('/api/laundries')
            .send({name: laundries[0].model.name})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(409)
            .then(res => res.body.should.deep.equal({message: 'Laundry already exists'}))))
      it('should succeed', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .post('/api/laundries')
            .send({name: laundries[0].model.name + ' 2'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
              const id = res.body.id
              return LaundryHandler.findFromId(id).then((laundry) => {
                laundry.should.not.be.undefined
                return laundry.toRest().then((result) => res.body.should.deep.equal(result))
              })
            })))
      it('should trim', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundry}) => {
          const name = `${laundry.model.name} 2   `
          return request(app)
            .post('/api/laundries')
            .send({name})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
              const id = res.body.id
              res.body.name.should.equal(name.trim())
              return LaundryHandler.findFromId(id).then((laundry) => {
                laundry.should.not.be.undefined
                return laundry.toRest().then((result) => res.body.should.deep.equal(result))
              })
            })
        }))
    })

    describe('POST /api/laundries/demo', () => {
      it('should create a new demo user', () => request(app)
        .post('/api/laundries/demo')
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then(res => UserHandler.findFromEmail(res.body.email).then(user => {
          assert(user)
          user.isDemo.should.be.true
        })))

      it('should create a new user with one-time password', () => request(app)
        .post('/api/laundries/demo')
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then(res => UserHandler.findFromEmail(res.body.email).then(user => user
          .verifyPassword(res.body.password).then(result => {
            assert(result)
            return user.verifyPassword(res.body.password).should.eventually.be.false
          }))))

      it('should create a new user with one-time password', () => request(app)
        .post('/api/laundries/demo')
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then(res => UserHandler.findFromEmail(res.body.email).then(user => {
          assert(user.isVerified(res.body.email))
        })))

      it('should create a new user with a demo laundry', () => request(app)
        .post('/api/laundries/demo')
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then(res => UserHandler.findFromEmail(res.body.email).then(user => user.fetchLaundries().then(laundries => {
          laundries.should.have.length(1)
          laundries[0].isDemo.should.be.true
        }))))

      it('should create a new user with a laundry and two machines', () => request(app)
        .post('/api/laundries/demo')
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .then(res => UserHandler.findFromEmail(res.body.email).then(user => user.fetchLaundries().then(([laundry]) => {
          laundry.machineIds.should.have.length(2)
        }))))
    })

    describe('GET /api/laundries/{id}', () => {
      it('should fail on not authenticated', () => request(app)
        .get('/api/laundries/id')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .get('/api/laundries/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .get('/api/laundries/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on other id', () =>
        Promise.all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
          .then(([{laundry}, {user, token}]) => request(app)
            .get(`/api/laundries/${laundry.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should succeed', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .get(`/api/laundries/${laundries[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => laundries[0].toRest().then((result) => res.body.should.deep.equal(result)))))

      it('should succeed 2', () =>
        dbUtils.populateMachines(2).then(({user, token, laundry}) =>
          request(app)
            .get(`/api/laundries/${laundry.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => LaundryHandler
              .findFromId(laundry.model.id)
              .then(laundry => laundry.toRest())
              .then((result) => res.body.should.deep.equal(result)))))

      it('should succeed 3', () =>
        dbUtils.populateInvites(2).then(({user, token, laundry}) =>
          request(app)
            .get(`/api/laundries/${laundry.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => LaundryHandler
              .findFromId(laundry.model.id)
              .then(laundry => laundry.toRest())
              .then((result) => res.body.should.deep.equal(result)))))

      it('should succeed when only user', () =>
        Promise
          .all([dbUtils.populateTokens(1), dbUtils.populateLaundries(1)])
          .then(([{user, token}, {laundry}]) =>
            laundry.addUser(user)
              .then(() =>
                request(app)
                  .get(`/api/laundries/${laundry.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect('Content-Type', /json/)
                  .expect(200)
                  .then(res => laundry.toRest().then(result => res.body.should.deep.equal(result))))))
    })

    describe('PUT /api/laundries/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .put('/api/laundries/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({name: 'L1'})
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .put('/api/laundries/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({name: 'L1'})
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .put('/api/laundries/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .send({name: 'L1'})
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))
      it('should return 404 on other id', () =>
        Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
          .then(([{laundry}, {user, token}]) =>
            request(app)
              .put(`/api/laundries/${laundry.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .send({name: 'L1'})
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should succeed', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .put(`/api/laundries/${laundries[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .send({name: 'L1'})
            .expect(204)
            .then(() => LaundryHandler
              .findFromId(laundries[0].model.id)
              .then(laundry => laundry.model.name.should.equal('L1')))))

      it('should succeed same name', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundry}) =>
          request(app)
            .put(`/api/laundries/${laundry.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .send({name: laundry.model.name})
            .expect(204)))

      it('should succeed same name trimmed', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundry}) => {
          const name = laundry.model.name
          return request(app)
            .put(`/api/laundries/${laundry.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .send({name: `${name}    `})
            .expect(204)
            .then(() => LaundryHandler
              .findFromId(laundry.model.id)
              .then(laundry => laundry.model.name.should.equal(name)))
        }))

      it('should fail on other laundry', () =>
        dbUtils.populateLaundries(2).then(({user, token, laundries: [laundry1, laundry2]}) =>
          request(app)
            .put(`/api/laundries/${laundry1.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .send({name: laundry2.model.name})
            .expect(409)))

      it('should fail when only user', () =>
        Promise
          .all([dbUtils.populateTokens(1), dbUtils.populateLaundries(1)])
          .then(([{token, user}, {laundry}]) => laundry.addUser(user)
            .then(() => request(app)
              .put(`/api/laundries/${laundry.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .send({name: 'L1'})
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(403)
              .then(res => res.body.should.deep.equal({message: 'Not allowed'})))))
    })

    describe('POST /api/laundries/{id}/invite-by-email', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .post('/api/laundries/id/invite-by-email')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .post('/api/laundries/id/invite-by-email')
            .send({email: 'alice@example.com'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))
      it('should return 404 on missing id', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .post('/api/laundries/id/invite-by-email')
            .send({email: 'alice@example.com'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))
      it('should return 404 on other id', () =>
        Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
          .then(([{laundry}, {user, token}]) =>
            request(app)
              .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
              .send({email: 'alice@example.com'})
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .then(res => res.body.should.deep.equal({message: 'Not found'}))))
      it('should succeed', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundry}) =>
          request(app)
            .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
            .send({email: 'alice@example.com'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)))

      it('should fail if demo', () =>
        dbUtils.populateLaundries(1)
          .then(({user, token, laundry}) => {
            laundry.model.demo = true
            return laundry.model.save().then(() => ({user, token, laundry}))
          })
          .then(({user, token, laundry}) =>
            request(app)
              .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
              .send({email: 'alice@example.com'})
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect(403)))

      it('should create invitation', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundry}) =>
          request(app)
            .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
            .send({email: 'alice@example.com'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .then(res => LaundryInvitationHandler
              .find({email: 'alice@example.com', laundry: laundry.model._id})
              .then(([invitation]) => {
                chai.assert(invitation !== undefined, 'Invitation should not be undefined.')
              }))))

      it('should create invitation in lower case', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundry}) =>
          request(app)
            .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
            .send({email: 'ALICE@example.com'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .then(res => LaundryInvitationHandler
              .find({email: 'alice@example.com', laundry: laundry.model._id})
              .then(([invitation]) => {
                chai.assert(invitation !== undefined, 'Invitation should not be undefined.')
              }))))

      it('should not create another invitation', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundry}) =>
          laundry.inviteUserByEmail('alice@example.com').then(() =>
            request(app)
              .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
              .send({email: 'alice@example.com'})
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect(204)
              .then(res => LaundryInvitationHandler
                .find({email: 'alice@example.com', laundry: laundry.model._id})
                .then((invitations) => {
                  invitations.should.have.length(1)
                })))))
      it('should add existing user instead of create invitation', () =>
        dbUtils.populateLaundries(1)
          .then(({user, token, laundry}) =>
            request(app)
              .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
              .send({email: user.model.emails[0]})
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect(204)
              .then(res => LaundryInvitationHandler
                .find({email: user.model.emails[0], laundry: laundry.model._id})
                .then((invitations) => {
                  invitations.should.have.length(0)
                }))))
      it('should add existing user instead of create invitation 2', () =>
        Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
          .then(([{laundry, user, token}, [user2]]) => {
            const email = user2.model.emails[0]
            return request(app)
              .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
              .send({email})
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect(204)
              .then(res => LaundryInvitationHandler
                .find({email, laundry: laundry.model._id})
                .then((invitations) => {
                  invitations.should.have.length(0)
                  return UserHandler.findFromEmail(email)
                    .then((user) => user.model.laundries[0].toString().should.equal(laundry.model.id))
                }))
          }))

      it('should fail when only user', () =>
        Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateTokens(1)])
          .then(([{laundry}, {user, token}]) => laundry
            .addUser(user)
            .then(() =>
              request(app)
                .post(`/api/laundries/${laundry.model.id}/invite-by-email`)
                .send({email: 'alice@example.com'})
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(403)
                .then(res => res.body.should.deep.equal({message: 'Not allowed'})))))
    })

    describe('DELETE /api/laundries/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/api/laundries/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .delete('/api/laundries/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .delete('/api/laundries/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on other id', () =>
        Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
          .then(([{laundry}, {user, token}]) =>
            request(app)
              .delete(`/api/laundries/${laundry.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should succeed', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .delete(`/api/laundries/${laundries[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .then(res => LaundryHandler
              .findFromId(laundries[0].model.id)
              .then((t) => assert(t === undefined)))))

      it('should fail if demo', () =>
        dbUtils.populateLaundries(1)
          .then(({user, token, laundry}) => {
            laundry.model.demo = true
            return laundry.save().then(() => ({user, token, laundry}))
          })
          .then(({user, token, laundry}) =>
            request(app)
              .delete(`/api/laundries/${laundry.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect(403)))

      it('should fail when only user', () =>
        Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
          .then(([{laundry}, {user, token}]) =>
            laundry.addUser(user)
              .then(() =>
                request(app)
                  .delete(`/api/laundries/${laundry.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect('Content-Type', /json/)
                  .expect(403)
                  .then(res => res.body.should.deep.equal({message: 'Not allowed'})))))
    })

    describe('DELETE /api/laundries/{id}/users/{userId}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/api/laundries/id/users/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateLaundries(1).then(({user, token, laundries}) =>
          request(app)
            .delete('/api/laundries/id/users/userId')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(404)
            .expect('Content-Type', /json/)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
          .then(([{user, token, laundry}, [user2]]) => laundry.addUser(user2).then(() => ({
            owner: user,
            token,
            laundry,
            user: user2
          })))
          .then(({owner, token, laundry}) =>
            request(app)
              .delete(`/api/laundries/${laundry.model.id}/users/id`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(owner.model.id, token.secret)
              .expect(404)
              .expect('Content-Type', /json/)
              .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on other id', () =>
        Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
          .then(([{laundry}, {user, token}]) =>
            request(app)
              .delete(`/api/laundries/${laundry.model.id}/users/id`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect(404)
              .expect('Content-Type', /json/)
              .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 403 on other user id', () =>
        Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
          .then(([{user, token, laundry}, [user2]]) => ({owner: user, token, laundry, user: user2}))
          .then(({owner, user, token, laundry}) =>
            request(app)
              .delete(`/api/laundries/${laundry.model.id}/users/${user.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(owner.model.id, token.secret)
              .expect(403)
              .expect('Content-Type', /json/)
              .then(res => res.body.should.deep.equal({message: 'Not allowed'}))))

      it('should succeed', () =>
        Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
          .then(([{user, token, laundry}, [user2]]) => laundry.addUser(user2).then(() => ({
            owner: user,
            token,
            laundry,
            user: user2
          })))
          .then(({user, owner, token, laundry}) =>
            request(app)
              .delete(`/api/laundries/${laundry.model.id}/users/${user.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(owner.model.id, token.secret)
              .expect(204)
              .then(res => LaundryHandler
                .findFromId(laundry.model.id)
                .then((laundry) => Boolean(laundry.isUser(user)).should.be.false))))
      it('should fail when only user', () =>
        Promise.all([dbUtils.populateLaundries(1), dbUtils.populateTokens(1), dbUtils.populateUsers(1)])
          .then(([{laundry}, {token, user}, [user2]]) => Promise
            .all([laundry.addUser(user), laundry.addUser(user2)])
            .then(() => ({
              token,
              laundry,
              user1: user,
              user2: user2
            })))
          .then(({user1, user2, token, laundry}) =>
            request(app)
              .delete(`/api/laundries/${laundry.model.id}/users/${user2.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user1.model.id, token.secret)
              .expect(403)
              .then(res => res.body.should.deep.equal({message: 'Not allowed'}))))

      it('should fail when deleting owner', () =>
        Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
          .then(([{laundry, token, user}, [user2]]) => laundry.addOwner(user2)
            .then(() => ({
              token,
              laundry,
              user1: user,
              user2: user2
            })))
          .then(({user1, user2, token, laundry}) =>
            request(app)
              .delete(`/api/laundries/${laundry.model.id}/users/${user2.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user1.model.id, token.secret)
              .expect(403)
              .then(res => res.body.should.deep.equal({message: 'Not allowed'}))))
    })
  })
})
