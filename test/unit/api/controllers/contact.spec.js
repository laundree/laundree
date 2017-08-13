// @flow

import request from 'supertest'
import promisedApp from '../../../../test_target/api/app'
import assert from 'assert'

const dbUtils = require('../../../db_utils')

let app

describe('controllers', function () {
  this.timeout(10000)
  beforeEach(async () => {
    await dbUtils.clearDb()
    app = await promisedApp
  })
  describe('contact', () => {
    it('should fail when not logged in and omitting sender', async () => {
      const res = await request(app)
        .post('/contact')
        .send({message: 'foo', subject: 'bar'})
        .expect(400)
      assert.deepEqual(res.body, {message: 'Name is required'})
    })

    it('should fail when not logged in and omitting sender 2', async () => {
      const res = await request(app)
        .post('/contact')
        .send({message: 'foo', subject: 'bar', name: 'Bob'})
        .expect(400)
      assert.deepEqual(res.body, {message: 'E-mail is required'})
    })

    it('should succeed', () =>
      request(app)
        .post('/contact')
        .send({message: 'foo', subject: 'bar', name: 'Bob', email: 'a@example.com'})
        .expect(204))

    it('should when logged in and omitting sender', async () => {
      const {user, token} = await dbUtils.populateTokens(1)
      request(app)
        .post('/contact')
        .auth(user.model.id, token.secret)
        .send({message: 'foo', subject: 'bar'})
        .expect(204)
    })
  })
})
