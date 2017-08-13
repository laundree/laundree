// @flow

import request from 'supertest'
import promisedApp from '../../../../test_target/api/app'
import LaundryInvitationHandler from '../../../../test_target/handlers/laundry_invitation'
import * as dbUtils from '../../../db_utils'
import assert from 'assert'

let app

describe('controllers', function () {
  beforeEach(async () => {
    await dbUtils.clearDb()
    app = await promisedApp
  })
  describe('invites', function () {
    this.timeout(5000)
    describe('GET /invites/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .get('/invites/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return 404 on invalid id', async () => {
        const {user, token} = await dbUtils.populateInvites(1)
        const res = await request(app)
          .get('/invites/idæø')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on missing id', async () => {
        const {user, token} = await dbUtils.populateInvites(1)
        const res = await request(app)
          .get('/invites/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 403 on other id', async () => {
        const [{invite}, {user, token}] = await Promise
          .all([dbUtils.populateInvites(1), dbUtils.populateInvites(1)])
        const res = await request(app)
          .get(`/invites/${invite.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should succeed', async () => {
        const {user, token, invite} = await dbUtils.populateInvites(1)
        const res = await request(app)
          .get(`/invites/${invite.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(200)
        assert.deepEqual(res.body, await invite.toRest())
      })

      it('should fail when only user', async () => {
        const [{user, token}, {invite, laundry}] = await Promise
          .all([dbUtils.populateTokens(1), dbUtils.populateInvites(1)])
        await laundry
          .addUser(user)
        const res = await request(app)
          .get(`/invites/${invite.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })
    })
    describe('DELETE /invites/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/invites/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return 404 on invalid id', async () => {
        const {user, token} = await dbUtils.populateInvites(1)
        const res = await request(app)
          .delete('/invites/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 403 on other id', async () => {
        const [{invite}, {user, token}] = await Promise.all([dbUtils.populateInvites(1), dbUtils.populateInvites(1)])
        const res = await request(app)
          .delete(`/invites/${invite.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should succeed', async () => {
        const {user, token, invite} = await dbUtils.populateInvites(1)
        await request(app)
          .delete(`/invites/${invite.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(204)
        const t = await LaundryInvitationHandler
          .lib
          .findFromId(invite.model.id)
        assert(!t)
      })

      it('should fail when other user', async () => {
        const [{user, token}, {invite, laundry}] = await Promise
          .all([dbUtils.populateTokens(1), dbUtils.populateInvites(1)])
        await laundry.addUser(user)
        const res = await request(app)
          .delete(`/invites/${invite.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })
    })
  })
})
