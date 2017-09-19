// @flow

import request from 'supertest'
import promisedApp from '../../../../test_target/api/app'
import TokenHandler from '../../../../test_target/handlers/token'
import UserHandler from '../../../../test_target/handlers/user'
import * as dbUtils from '../../../db_utils'
import faker from 'faker'
import assert from 'assert'
import { signAppToken } from '../../../../test_target/auth'

let app

describe('controllers', function () {
  beforeEach(async () => {
    await dbUtils.clearDb()
    app = await promisedApp
  })
  describe('tokens', function () {
    this.timeout(5000)
    describe('GET /tokens', () => {
      it('should fail on not authenticated', async () => {
        request(app)
          .get('/tokens')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
      })
      it('should limit output size', async () => {
        const {user, tokens} = await dbUtils.populateTokens(50)
        const res = await request(app)
          .get('/tokens')
          .set('Accept', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
          .expect(200)
        const arr = tokens.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).slice(0, 10).map(TokenHandler.restSummary)
        assert.deepEqual(res.body, arr)
      })

      it('should allow custom output size', async () => {
        const {user, tokens} = await dbUtils.populateTokens(50)
        const res = await request(app)
          .get('/tokens')
          .query({page_size: 12})
          .auth(user.model.id, tokens[0].secret)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
          .expect(200)
        const arr = tokens.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).slice(0, 12).map(TokenHandler.restSummary)
        assert.deepEqual(res.body, arr)
      })

      it('should only fetch from current user', async () => {
        const [{user, tokens}] = await Promise.all([dbUtils.populateTokens(1), dbUtils.populateTokens(2)])
        const res = await request(app)
          .get('/tokens')
          .auth(user.model.id, tokens[0].secret)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
          .expect(200)
        const arr = tokens.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map(TokenHandler.restSummary)
        assert.deepEqual(res.body, arr)
      })

      it('should allow since', async () => {
        const {user, tokens} = await dbUtils.populateTokens(50)
        const sortedTokens = tokens.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id))
        const res = await request(app)
          .get('/tokens')
          .query({since: tokens[24].model.id, page_size: 1})
          .auth(user.model.id, tokens[0].secret)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
          .expect(200)
        assert.deepEqual(res.body, [TokenHandler.restSummary(sortedTokens[25])])
      })
    })

    describe('POST /users/:userId/tokens', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .post('/users/someid/tokens')
          .send({name: 'Token 1', type: 'auth'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should fail on empty name', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        await request(app)
          .post(`/users/${user.model.id}/tokens`)
          .send({name: ' ', type: 'auth'})
          .set('Accept', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(400)
      })

      it('should fail on duplicate name', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .post(`/users/${user.model.id}/tokens`)
          .send({name: tokens[0].model.name, type: 'auth'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(409)
        assert.deepEqual(res.body, {message: 'Token already exists'})
      })

      it('should succeed', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .post(`/users/${user.model.id}/tokens`)
          .send({name: tokens[0].model.name + ' 2', type: 'auth'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(200)
        const id = res.body.id
        const token = await TokenHandler.lib.findFromId(id)
        assert(token)
        const result = await token.toRest()
        result.secret = res.body.secret
        assert.deepEqual(res.body, result)
      })

      it('should succeed 2', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .post(`/users/${user.model.id}/tokens`)
          .send({name: tokens[0].model.name + ' 2', type: 'auth'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(200)
        const id = res.body.id
        const token = await TokenHandler
          .lib
          .findFromId(id)
        const result = await token.verify(res.body.secret)
        assert(result)
      })
      it('should succeed 3', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .post(`/users/${user.model.id}/tokens`)
          .send({name: tokens[0].model.name + ' 2', type: 'auth'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(200)
        const id = res.body.id
        const token = await TokenHandler.lib.findFromId(id)
        assert(token)
        const result = await token.verify(res.body.secret.split('.')[2])
        assert(result)
      })
      it('should succeed calendar', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .post(`/users/${user.model.id}/tokens`)
          .send({name: tokens[0].model.name + ' 2', type: 'calendar'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(200)
        const id = res.body.id
        const token = await TokenHandler.lib.findFromId(id)
        assert(token)
        const result = await token.toRest()
        result.secret = res.body.secret
        assert.deepEqual(res.body, result)
      })

      it('should succeed calendar 2', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .post(`/users/${user.model.id}/tokens`)
          .send({name: tokens[0].model.name + ' 2', type: 'calendar'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(200)
        const id = res.body.id
        const token = await TokenHandler
          .lib
          .findFromId(id)
        const result = await token.verify(res.body.secret)
        assert(result)
      })
      it('should succeed calendar 3', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .post(`/users/${user.model.id}/tokens`)
          .send({name: tokens[0].model.name + ' 2', type: 'calendar'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(200)
        const id = res.body.id
        const token = await TokenHandler.lib.findFromId(id)
        assert(token)
        const result = await token.verify(res.body.secret.split('.')[2])
        assert(result)
      })
    })
    describe('POST /users/{userId}/tokens/verify', () => {
      it('should fail on not authenticated', async () => {
        const {user} = await dbUtils.populateTokens(1)
        await request(app)
          .post(`/users/${user.model.id}/tokens/verify`)
          .expect(401)
      })
      it('should fail on not self', async () => {
        const {user, token} = await dbUtils.populateTokens(1)
        const [user2] = await dbUtils.populateUsers(1)
        await request(app)
          .post(`/users/${user2.model.id}/tokens/verify`)
          .auth(user.model.id, token.secret)
          .send({token: 'some token', type: 'auth'})
          .expect(403)
      })
      it('should fail on self with wrong token', async () => {
        const {user, token} = await dbUtils.populateTokens(1)
        await request(app)
          .post(`/users/${user.model.id}/tokens/verify`)
          .auth(user.model.id, token.secret)
          .send({token: 'some token', type: 'auth'})
          .expect(400)
      })
      it('should fail on self with wrong token type', async () => {
        const {user, token} = await dbUtils.populateTokens(1)
        await request(app)
          .post(`/users/${user.model.id}/tokens/verify`)
          .auth(user.model.id, token.secret)
          .send({token: token.secret, type: 'calendar'})
          .expect(400)
      })
      it('should succeed on self with right token type', async () => {
        const {user, token} = await dbUtils.populateTokens(1)
        await request(app)
          .post(`/users/${user.model.id}/tokens/verify`)
          .auth(user.model.id, token.secret)
          .send({token: token.secret, type: 'auth'})
          .expect(204)
      })
      it('should fail on self with calendar token and wrong token type', async () => {
        const {user, token} = await dbUtils.populateTokens(1)
        const calendarToken = await user.generateCalendarToken('Some fancy calendar token')
        await request(app)
          .post(`/users/${user.model.id}/tokens/verify`)
          .auth(user.model.id, token.secret)
          .send({token: calendarToken.secret, type: 'auth'})
          .expect(400)
      })
      it('should succeed on web with right token type', async () => {
        const {user, token} = await dbUtils.populateTokens(1)
        const jwt = await signAppToken('https://web.laundree.io', 'https://api.laundree.io')
        await request(app)
          .post(`/users/${user.model.id}/tokens/verify`)
          .set('Authorization', `Bearer ${jwt}`)
          .send({token: token.secret, type: 'auth'})
          .expect(204)
      })
    })
    describe('POST /tokens/email-password', () => {
      let user, token
      const name = faker.name.findName()
      const email = faker.internet.email()
      const password = faker.internet.password()
      const tokenName = 'token1'
      beforeEach(async () => {
        user = await UserHandler.lib.createUserWithPassword(name, email, password)
        const t1 = await user.generateVerifyEmailToken(email)
        await user.verifyEmail(email, t1.secret)
        token = await user.generateAuthToken(tokenName)
      })
      it('should fail with wrong email', () =>
        request(app)
          .post('/tokens/email-password')
          .send({email: 'nonExistingEmail@gmail.com', password, name: 'New Token 1'})
          .expect(403)
      )
      it('should fail with wrong password', () =>
        request(app)
          .post('/tokens/email-password')
          .send({email, password: password + 'lol', name: 'New Token 1'})
          .expect(403)
      )
      it('should fail existing token', () =>
        request(app)
          .post('/tokens/email-password')
          .send({email, password: password, name: tokenName})
          .expect(409)
          .expect('Location', token.restUrl)
      )
      it('should succeed', async () => {
        const {body} = await request(app)
          .post('/tokens/email-password')
          .send({email, password: password, name: 'Token 1'})
          .expect(200)
        const t = await TokenHandler.lib.findFromId(body.id)
        const tRest = await t.toRest()
        assert.deepEqual({...tRest, secret: body.secret}, body)
      })
    })
    describe('GET /tokens/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .get('/tokens/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401)
      )

      it('should return 404 on invalid id', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .get('/tokens/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on missing id', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .get('/tokens/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on other id', async () => {
        const {tokens: [token1]} = await dbUtils.populateTokens(1)
        const {user, tokens: [token2]} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .get(`/tokens/${token1.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token2.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should succeed', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .get(`/tokens/${tokens[0].model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(200)
        const result = await tokens[0].toRest()
        assert.deepEqual(res.body, result)
      })
    })
    describe('DELETE /tokens/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/tokens/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401)
      )

      it('should return 404 on invalid id', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .delete('/tokens/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })
      it('should return 404 on missing id', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .delete('/tokens/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on other id', async () => {
        const {token: token1} = await dbUtils.populateTokens(1)
        const {user, token: token2} = await dbUtils.populateTokens(1)
        const res = await request(app)
          .delete(`/tokens/${token1.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token2.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should succeed', async () => {
        const {user, tokens} = await dbUtils.populateTokens(1)
        await request(app)
          .delete(`/tokens/${tokens[0].model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, tokens[0].secret)
          .expect(204)
        const t = await TokenHandler
          .lib
          .findFromId(tokens[0].model.id)
        assert(!t)
      })
    })
  })
})
