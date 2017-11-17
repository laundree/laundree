// @flow

import request from 'supertest'
import promisedApp from '../../../../test_target/api/app'

const dbUtils = require('../../../db_utils')

let app

describe('controllers', function () {
  this.timeout(10000)
  beforeEach(async () => {
    await dbUtils.clearDb()
    app = await promisedApp
  })
  describe('contact', () => {
    describe('POST /concat', () => {
      it('should fail when not logged in and omitting sender', async () =>
        request(app)
          .post('/contact')
          .send({message: 'foo', subject: 'bar'})
          .expect(400))

      it('should fail when not logged in and omitting sender 2', async () =>
        request(app)
          .post('/contact')
          .send({message: 'foo', subject: 'bar', name: 'Bob'})
          .expect(400))

      it('should succeed', () =>
        request(app)
          .post('/contact')
          .send({message: 'foo', subject: 'bar', name: 'Bob', email: 'a@example.com'})
          .expect(204))

      it('should when logged in and omitting sender', async () => {
        const {user, token} = await dbUtils.populateTokens(1)
        return request(app)
          .post('/contact')
          .auth(user.model.id, token.secret)
          .send({message: 'foo', subject: 'bar'})
          .expect(400)
      })
    })
    describe('POST /concat/support', () => {
      it('should fail when not logged in ', async () =>
        request(app)
          .post('/contact/support')
          .send({message: 'foo', subject: 'bar'})
          .expect(401))

      it('should when logged in and omitting sender', async () => {
        const {user, token} = await dbUtils.populateTokens(1)
        return request(app)
          .post('/contact/support')
          .auth(user.model.id, token.secret)
          .send({message: 'foo', subject: 'bar'})
          .expect(204)
      })
    })
  })
})
