const request = require('supertest')
const app = require('../../../../test_target/app').app
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()
const assert = chai.assert
const {LaundryInvitationHandler} = require('../../../../test_target/handlers')
const dbUtils = require('../../../db_utils')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('invites', function () {
    this.timeout(5000)
    describe('GET /invites/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .get('/api/invites/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateInvites(1).then(({user, token}) =>
          request(app)
            .get('/api/invites/idæø')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateInvites(1).then(({user, token}) =>
          request(app)
            .get('/api/invites/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on other id', () =>
        Promise
          .all([dbUtils.populateInvites(1), dbUtils.populateInvites(1)])
          .then(([{invite, laundry}, {user, token}]) =>
            request(app)
              .get(`/api/invites/${invite.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should succeed', () =>
        dbUtils.populateInvites(1).then(({user, token, invite}) =>
          request(app)
            .get(`/api/invites/${invite.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => invite.toRest().then((result) => res.body.should.deep.equal(result)))))

      it('should fail when only user', () =>
        Promise
          .all([dbUtils.populateTokens(1), dbUtils.populateInvites(1)])
          .then(([{user, token}, {invite, laundry}]) => laundry
            .addUser(user)
            .then(() =>
              request(app)
                .get(`/api/invites/${invite.model.id}`)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(403)
                .then(res => res.body.should.deep.equal({message: 'Not allowed'})))))
    })
    describe('DELETE /invites/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/api/invites/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateInvites(1).then(({user, token}) =>
          request(app)
            .delete('/api/invites/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on other id', () =>
        Promise
          .all([dbUtils.populateInvites(1), dbUtils.populateInvites(1)])
          .then(([{invite}, {user, token}]) =>
            request(app)
              .delete(`/api/invites/${invite.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should succeed', () =>
        dbUtils.populateInvites(1).then(({user, token, invite}) =>
          request(app)
            .delete(`/api/invites/${invite.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .then(() => LaundryInvitationHandler
              .findFromId(invite.model.id)
              .then((t) => assert(t === undefined)))))

      it('should fail when other user', () =>
        Promise
          .all([dbUtils.populateTokens(1), dbUtils.populateInvites(1)])
          .then(([{user, token}, {invite, laundry}]) => laundry
            .addUser(user)
            .then(() =>
              request(app)
                .delete(`/api/invites/${invite.model.id}`)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(403)
                .then(res => res.body.should.deep.equal({message: 'Not allowed'})))))
    })
  })
})
