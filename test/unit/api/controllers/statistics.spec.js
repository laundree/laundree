// @flow

import * as dbUtils from '../../../db_utils'
import promisedApp from '../../../../test_target/api/app'
import { signAppToken, signUserToken } from '../../../../test_target/auth'
import request from 'supertest'
import assert from 'assert'
import LaundryHandler from '../../../../src/handlers/laundry'
import UserHandler from '../../../../src/handlers/user'
import MachineHandler from '../../../../src/handlers/machine'
import BookingHandler from '../../../../src/handlers/booking'
let app

describe('controllers', function () {
  beforeEach(async () => {
    await dbUtils.clearDb()
    app = await promisedApp
  })
  describe('statistics', function () {
    this.timeout(5000)
    describe('GET /statistics', () => {
      it('should fail without auth', async () => {
        await request(app)
          .get('/statistics')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401)
      })
      it('should fail with wrong auth', async () => {
        const [user] = await dbUtils.populateUsers(1)
        const jwt = await signUserToken(user.model.id, 'https://web.laundree.io', 'https://api.laundree.io')
        await request(app)
          .get('/statistics')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${jwt}`)
          .expect('Content-Type', /json/)
          .expect(403)
      })
      it('should succeed with app auth', async () => {
        await dbUtils.populateUsers(96)
        await dbUtils.populateLaundries(21)
        await dbUtils.populateBookings(124)
        await dbUtils.populateMachines(67)
        const jwt = await signAppToken('https://web.laundree.io', 'https://api.laundree.io')
        const res = await request(app)
          .get('/statistics')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${jwt}`)
          .expect('Content-Type', /json/)
          .expect(200)
        assert.deepEqual({
          laundryCount: await LaundryHandler.lib.fetchCount(),
          userCount: await UserHandler.lib.fetchCount(),
          bookingCount: await BookingHandler.lib.fetchCount(),
          machineCount: await MachineHandler.lib.fetchCount()
        }, res.body)
      })
    })
  })
})
