// @flow

import request from 'supertest'
import promisedApp from '../../../../test_target/api/app'
import LaundryHandler from '../../../../test_target/handlers/laundry'
import LaundryInvitationHandler from '../../../../test_target/handlers/laundry_invitation'
import UserHandler from '../../../../test_target/handlers/user'
import BookingHandler from '../../../../test_target/handlers/booking'
import * as dbUtils from '../../../db_utils'
import assert from 'assert'

import base64UrlSafe from 'urlsafe-base64'
import { signAppToken } from '../../../../test_target/auth'

let app

describe('controllers', function () {
  beforeEach(async () => {
    await dbUtils.clearDb()
    app = await promisedApp
  })
  describe('laundries', function () {
    this.timeout(5000)
    describe('GET /laundries', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .get('/laundries')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should limit output size', async () => {
        const {user, token, laundries} = await dbUtils.populateLaundries(50)
        const res = await request(app)
          .get('/laundries')
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
          .expect(200)
        const arr = laundries.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)).slice(0, 10).map(LaundryHandler.restSummary)
        assert.deepEqual(res.body, arr)
      })
      it('should allow custom output size', async () => {
        const {user, token, laundries} = await dbUtils.populateLaundries(50)
        const res = await request(app)
          .get('/laundries')
          .query({page_size: 12})
          .auth(user.model.id, token.secret)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
          .expect(200)
        const arr = laundries.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).slice(0, 12).map(LaundryHandler.restSummary)
        assert.deepEqual(res.body, arr)
      })

      it('should only fetch from current user', async () => {
        const [{user, token, laundries}] = await Promise.all([dbUtils.populateLaundries(2), dbUtils.populateLaundries(1)])
        const res = await request(app)
          .get('/laundries')
          .auth(user.model.id, token.secret)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
          .expect(200)
        const arr = laundries.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map(LaundryHandler.restSummary)
        assert.deepEqual(res.body, arr)
      })

      it('should fetch all for administrator', async () => {
        const [{laundries: laundries1}, {laundries: laundries2}, {user, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(2), dbUtils.createAdministrator()])
        const res = await request(app)
          .get('/laundries')
          .auth(user.model.id, token.secret)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
          .expect(200)
        const laundries = laundries1.concat(laundries2)
        const arr = laundries.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map(LaundryHandler.restSummary)
        assert.deepEqual(res.body, arr)
      })

      it('should allow since', async () => {
        const {user, token, laundries: ls} = await dbUtils.populateLaundries(50)
        const laundries = ls.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id))
        const res = await request(app)
          .get('/laundries')
          .query({since: laundries[24].model.id, page_size: 1})
          .auth(user.model.id, token.secret)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
          .expect(200)
        assert.deepEqual(res.body, [LaundryHandler.restSummary(laundries[25])])
      })
    })

    describe('POST /laundries', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .post('/laundries')
          .send({name: 'Laundry 1', googlePlaceId: 'ChIJs4G9sJQ_TEYRHG0LNOr0w-I'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should fail on empty name', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        await request(app)
          .post('/laundries')
          .send({name: ' ', googlePlaceId: 'ChIJs4G9sJQ_TEYRHG0LNOr0w-I'})
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(400)
      })

      it('should fail on invalid place id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        await request(app)
          .post('/laundries')
          .send({name: ' ', googlePlaceId: '<3'})
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(400)
      })

      it('should fail on duplicate name', async () => {
        const {user, token, laundries} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .post('/laundries')
          .send({name: laundries[0].model.name, googlePlaceId: 'ChIJs4G9sJQ_TEYRHG0LNOr0w-I'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(409)
        assert.deepEqual(res.body, {message: 'Laundry already exists'})
      })

      it('should fail on demo user', async () => {
        const {user, token} = await dbUtils.populateTokens(1)
        user.model.demo = true
        await user.save()
        await request(app)
          .post('/laundries')
          .send({name: 'Some crazy laundry', googlePlaceId: 'ChIJs4G9sJQ_TEYRHG0LNOr0w-I'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
      })

      it('should succeed', async () => {
        const {user, token, laundries} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .post('/laundries')
          .send({name: laundries[0].model.name + ' 2', googlePlaceId: 'ChIJs4G9sJQ_TEYRHG0LNOr0w-I'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(200)
        const id = res.body.id
        const laundry = await LaundryHandler.lib.findFromId(id)
        assert(laundry)
        assert.deepEqual(await laundry.toRest(), res.body)
      })
      it('should set timezone', async () => {
        const {user, token, laundries} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .post('/laundries')
          .send({name: laundries[0].model.name + ' 2', googlePlaceId: 'ChIJJSezGs4Nok4RBiNpTfsl5D0'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(200)
        const id = res.body.id
        const laundry = await LaundryHandler.lib.findFromId(id)
        assert(laundry)
        assert.equal(laundry.timezone(), 'America/Godthab')
        assert.deepEqual(await laundry.toRest(), res.body)
      })
      it('should trim', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        const name = `${laundry.model.name} 2   `
        const res = await request(app)
          .post('/laundries')
          .send({name, googlePlaceId: 'ChIJs4G9sJQ_TEYRHG0LNOr0w-I'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(200)
        const id = res.body.id
        assert.equal(res.body.name, name.trim())
        const l = await LaundryHandler.lib.findFromId(id)
        assert(l)
        assert.deepEqual(await l.toRest(), res.body)
      })
    })

    describe('POST /laundries/demo', () => {
      it('should create a new demo user', async () => {
        const res = await request(app)
          .post('/laundries/demo')
          .expect(200)
          .expect('Content-Type', /application\/json/)
        const user = await UserHandler.lib.findFromEmail(res.body.email)
        assert(user)
        assert(user.isDemo())
      })

      it('should create a new user with one-time password', async () => {
        const res = await request(app)
          .post('/laundries/demo')
          .expect(200)
          .expect('Content-Type', /application\/json/)
        const user = await UserHandler.lib.findFromEmail(res.body.email)
        assert(await user.verifyPassword(res.body.password))
        assert(!await user.verifyPassword(res.body.password))
      })

      it('should create a new user with one-time password', async () => {
        const res = await request(app)
          .post('/laundries/demo')
          .expect(200)
          .expect('Content-Type', /application\/json/)
        const user = await UserHandler.lib.findFromEmail(res.body.email)
        assert(user.isVerified(res.body.email))
      })

      it('should create a new user with a demo laundry', async () => {
        const res = await request(app)
          .post('/laundries/demo')
          .expect(200)
          .expect('Content-Type', /application\/json/)
        const user = await UserHandler.lib.findFromEmail(res.body.email)
        const laundries = await user.fetchLaundries()
        assert.equal(laundries.length, 1)
        assert(laundries[0].isDemo())
      })

      it('should create a new user with a laundry and two machines', async () => {
        const res = await request(app)
          .post('/laundries/demo')
          .expect(200)
          .expect('Content-Type', /application\/json/)
        const user = await UserHandler.lib.findFromEmail(res.body.email)
        const [laundry] = await user.fetchLaundries()
        assert.equal(laundry.model.machines.length, 2)
      })
    })

    describe('GET /laundries/{id}', () => {
      it('should fail on not authenticated', () => request(app)
        .get('/laundries/id')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401))

      it('should return 404 on invalid id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .get('/laundries/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on missing id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .get('/laundries/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on other id', async () => {
        const [{laundry}, {user, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
        const res = await request(app)
          .get(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should succeed', async () => {
        const {user, token, laundries} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .get(`/laundries/${laundries[0].model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(200)
        assert.deepEqual(await laundries[0].toRest(), res.body)
      })

      it('should succeed when administrator', async () => {
        const [{laundries}, {user, token}] = await Promise
          .all([dbUtils.populateLaundries(1), dbUtils.createAdministrator()])
        const res = await request(app)
          .get(`/laundries/${laundries[0].model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(200)
        assert.deepEqual(await laundries[0].toRest(), res.body)
      })

      it('should succeed 2', async () => {
        const {user, token, laundry} = await dbUtils.populateMachines(2)
        const res = await request(app)
          .get(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(200)
        const l = await LaundryHandler
          .lib
          .findFromId(laundry.model.id)
        assert.deepEqual(await l.toRest(), res.body)
      })

      it('should succeed 3', async () => {
        const {user, token, laundry} = await dbUtils.populateInvites(2)
        const res = await request(app)
          .get(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(200)
        const l = await LaundryHandler.lib.findFromId(laundry.model.id)
        assert.deepEqual(await l.toRest(), res.body)
      })

      it('should succeed when only user', async () => {
        const [{user, token}, {laundry}] = await Promise
          .all([dbUtils.populateTokens(1), dbUtils.populateLaundries(1)])
        await laundry.addUser(user)
        const res = await request(app)
          .get(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(200)
        assert.deepEqual(await laundry.toRest(), res.body)
      })
    })

    describe('PUT /laundries/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .put('/laundries/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({name: 'L1'})
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return 404 on invalid id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .put('/laundries/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({name: 'L1'})
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on missing id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .put('/laundries/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({name: 'L1'})
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on other id', async () => {
        const [{laundry}, {user, token}] = await Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
        const res = await request(app)
          .put(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({name: 'L1'})
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should succeed', async () => {
        const {user, token, laundries} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .put(`/laundries/${laundries[0].model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({name: 'L1'})
          .expect(200)
        const laundry = await LaundryHandler
          .lib
          .findFromId(laundries[0].model.id)
        assert.equal(laundry.model.name, 'L1')
        assert.deepEqual(res.body, await laundry.toRest())
      })

      it('should succeed with name and place', async () => {
        const {user, token, laundries} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .put(`/laundries/${laundries[0].model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({name: 'L1', googlePlaceId: 'ChIJJSezGs4Nok4RBiNpTfsl5D0'})
          .expect(200)
        const laundry = await LaundryHandler
          .lib
          .findFromId(laundries[0].model.id)
        assert.deepEqual(res.body, await laundry.toRest())
        assert.equal(laundry.model.name, 'L1')
        assert.equal(laundry.timezone(), 'America/Godthab')
        assert.deepEqual(laundry.model.rules.toObject(), {timeLimit: {from: {}, to: {}}})
      })

      it('should succeed with name and rule', async () => {
        const {user, token, laundries} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .put(`/laundries/${laundries[0].model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({name: 'L1', rules: {limit: 1000}})
          .expect(200)
        const laundry = await LaundryHandler
          .lib
          .findFromId(laundries[0].model.id)
        assert.deepEqual(res.body, await laundry.toRest())
        assert.equal(laundry.model.name, 'L1')
        assert.deepEqual(laundry.model.rules.toObject(), {timeLimit: {from: {}, to: {}}, limit: 1000})
      })

      it('should succeed with name more rules', async () => {
        const {user, token, laundries} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .put(`/laundries/${laundries[0].model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({
            name: 'L1',
            rules: {limit: 1000, dailyLimit: 52, timeLimit: {from: {hour: 10, minute: 30}, to: {hour: 11, minute: 0}}}
          })
          .expect(200)
        const laundry = await LaundryHandler.lib.findFromId(laundries[0].model.id)
        assert.deepEqual(res.body, await laundry.toRest())
        assert.equal(laundry.model.name, 'L1')
        assert.deepEqual(laundry.model.rules.toObject(), {
          timeLimit: {from: {hour: 10, minute: 30}, to: {hour: 11, minute: 0}},
          dailyLimit: 52,
          limit: 1000
        })
      })

      it('should succeed with place', async () => {
        const {user, token, laundries} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .put(`/laundries/${laundries[0].model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({googlePlaceId: 'ChIJJSezGs4Nok4RBiNpTfsl5D0'})
          .expect(200)
        const laundry = await LaundryHandler
          .lib
          .findFromId(laundries[0].model.id)
        assert.equal(laundry.model.name, laundries[0].model.name)
        assert.equal(laundry.timezone(), 'America/Godthab')
        assert.deepEqual(res.body, await laundry.toRest())
      })

      it('should succeed when administrator', async () => {
        const [{laundry}, {user, token}] = await Promise
          .all([dbUtils.populateLaundries(1), dbUtils.createAdministrator()])
        const name = `${laundry.model.name} 2`
        const res = await request(app)
          .put(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({name})
          .expect(200)
        const l = await LaundryHandler
          .lib
          .findFromId(laundry.model.id)
        assert.equal(l.model.name, name)
        assert.deepEqual(await l.toRest(), res.body)
      })

      it('should succeed same name', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .put(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({name: laundry.model.name})
          .expect(200)
        const l = await LaundryHandler
          .lib
          .findFromId(laundry.model.id)
        assert.equal(l.model.name, laundry.model.name)
        assert.deepEqual(await l.toRest(), res.body)
      })

      it('should succeed same name trimmed', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        const name = laundry.model.name
        const res = await request(app)
          .put(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({name: `${name}    `})
          .expect(200)
        const l = await LaundryHandler
          .lib
          .findFromId(laundry.model.id)
        assert.equal(l.model.name, name)
        assert.deepEqual(await l.toRest(), res.body)
      })

      it('should fail on other laundry', async () => {
        const {user, token, laundries: [laundry1, laundry2]} = await dbUtils.populateLaundries(2)
        await request(app)
          .put(`/laundries/${laundry1.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({name: laundry2.model.name})
          .expect(409)
      })

      it('should succeed on no options', async () => {
        const {user, token, laundries: [laundry1]} = await dbUtils.populateLaundries(2)
        await request(app)
          .put(`/laundries/${laundry1.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({})
          .expect(200)
      })

      it('should fail with invalid place id', async () => {
        const {user, token, laundries: [laundry1]} = await dbUtils.populateLaundries(2)
        const {body} = await request(app)
          .put(`/laundries/${laundry1.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({googlePlaceId: 'NotValid'})
          .expect(400)
        assert.deepEqual(body, {message: 'Invalid place-id'})
      })

      it('should fail invalid time-rule', async () => {
        const {user, token, laundries: [laundry1]} = await dbUtils.populateLaundries(2)
        const res = await request(app)
          .put(`/laundries/${laundry1.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .send({rules: {timeLimit: {from: {hour: 23, minute: 0}, to: {hour: 4, minute: 30}}}})
          .expect(400)
        assert.deepEqual(res.body, {message: 'From must be before to'})
      })

      it('should fail when only user', async () => {
        const [{token, user}, {laundry}] = await Promise
          .all([dbUtils.populateTokens(1), dbUtils.populateLaundries(1)])
        await laundry.addUser(user)
        const res = await request(app)
          .put(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({name: 'L1'})
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })
    })

    describe('POST /laundries/{id}/invite-by-email', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .post('/laundries/id/invite-by-email')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return 404 on invalid id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .post('/laundries/id/invite-by-email')
          .send({email: 'alice@example.com'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on missing id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .post('/laundries/id/invite-by-email')
          .send({email: 'alice@example.com'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on other id', async () => {
        const [{laundry}, {user, token}] = await Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
        const res = await request(app)
          .post(`/laundries/${laundry.model.id}/invite-by-email`)
          .send({email: 'alice@example.com'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should succeed', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        await request(app)
          .post(`/laundries/${laundry.model.id}/invite-by-email`)
          .send({email: 'alice@example.com'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(204)
      })

      it('should succeed if administrator', async () => {
        const [{laundry}, {user, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.createAdministrator()])
        await request(app)
          .post(`/laundries/${laundry.model.id}/invite-by-email`)
          .send({email: 'alice@example.com'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(204)
      })

      it('should fail if demo', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        laundry.model.demo = true
        await laundry.model.save()
        await request(app)
          .post(`/laundries/${laundry.model.id}/invite-by-email`)
          .send({email: 'alice@example.com'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(403)
      })

      it('should create invitation', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        await request(app)
          .post(`/laundries/${laundry.model.id}/invite-by-email`)
          .send({email: 'alice@example.com'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(204)
        const [invitation] = await LaundryInvitationHandler
          .lib
          .find({email: 'alice@example.com', laundry: laundry.model._id})
        assert(invitation !== undefined, 'Invitation should not be undefined.')
      })

      it('should create invitation in lower case', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        await request(app)
          .post(`/laundries/${laundry.model.id}/invite-by-email`)
          .send({email: 'ALICE@example.com'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(204)
        const [invitation] = await LaundryInvitationHandler
          .lib
          .find({email: 'alice@example.com', laundry: laundry.model._id})
        assert(invitation !== undefined, 'Invitation should not be undefined.')
      })

      it('should not create another invitation', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        await laundry.inviteUserByEmail('alice@example.com')
        await request(app)
          .post(`/laundries/${laundry.model.id}/invite-by-email`)
          .send({email: 'alice@example.com'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(204)
        const invitations = await LaundryInvitationHandler
          .lib
          .find({email: 'alice@example.com', laundry: laundry.model._id})
        assert.equal(invitations.length, 1)
      })

      it('should add existing user instead of create invitation', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        await request(app)
          .post(`/laundries/${laundry.model.id}/invite-by-email`)
          .send({email: user.model.emails[0]})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(204)
        const invitations = await LaundryInvitationHandler
          .lib
          .find({email: user.model.emails[0], laundry: laundry.model._id})
        assert.equal(invitations.length, 0)
      })
      it('should add existing user instead of create invitation 2', async () => {
        const {laundry, user, token} = await dbUtils.populateLaundries(1)
        const [user2] = await dbUtils.populateUsers(1)
        const email = user2.model.emails[0]
        await request(app)
          .post(`/laundries/${laundry.model.id}/invite-by-email`)
          .send({email})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(204)
        const invitations = await LaundryInvitationHandler.lib.find({email, laundry: laundry.model._id})
        assert.equal(invitations.length, 0)
        const u = await UserHandler.lib.findFromEmail(email)
        assert.equal(u.model.laundries[0].toString(), laundry.model.id)
      })

      it('should fail when only user', async () => {
        const {laundry} = await dbUtils.populateLaundries(1)
        const {user, token} = await dbUtils.populateTokens(1)
        await laundry.addUser(user)
        const res = await request(app)
          .post(`/laundries/${laundry.model.id}/invite-by-email`)
          .send({email: 'alice@example.com'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })
    })

    describe('POST /laundries/{id}/users/add-from-key', () => {
      let user1, token1, laundry, inviteCode
      beforeEach(async () => {
        const [{user: u, token: t}, {laundry: l}] = await Promise.all([dbUtils.populateTokens(1), dbUtils.populateLaundries(1)])
        user1 = u
        token1 = t
        laundry = l
        inviteCode = await laundry.createInviteCode()
      })
      it('should fail on not authenticated', () =>
        request(app)
          .post('/laundries/id/users/add-from-code')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))
      it('should fail on no laundry', () =>
        request(app)
          .post('/laundries/id/users/add-from-code')
          .auth(user1.model.id, token1.secret)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({key: 'lol'})
          .expect('Content-Type', /json/)
          .expect(404))

      it('should fail without right key', () =>
        request(app)
          .post(`/laundries/${laundry.model.id}/users/add-from-code`)
          .auth(user1.model.id, token1.secret)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({key: 'lol'})
          .expect('Content-Type', /json/)
          .expect(400))
      it('should succeed with key', async () => {
        await request(app)
          .post(`/laundries/${laundry.model.id}/users/add-from-code`)
          .auth(user1.model.id, token1.secret)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({key: inviteCode})
          .expect(204)
        const l = await LaundryHandler.lib.findFromId(laundry.model.id)
        assert(l.isUser(user1))
      })
    })

    describe('POST /laundries/{id}/invite-code', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .post('/laundries/id/invite-code')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return 404 on invalid id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .post('/laundries/id/invite-code')
          .send()
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on missing id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .post('/laundries/id/invite-code')
          .send()
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on other id', async () => {
        const [{laundry}, {user, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
        const res = await request(app)
          .post(`/laundries/${laundry.model.id}/invite-code`)
          .send()
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should succeed', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        await request(app)
          .post(`/laundries/${laundry.model.id}/invite-code`)
          .send()
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(200)
      })

      it('should succeed with valid key', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        await request(app)
          .post(`/laundries/${laundry.model.id}/invite-code`)
          .send()
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(200)
      })

      it('should succeed if administrator', async () => {
        const [{laundry}, {user, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.createAdministrator()])
        await request(app)
          .post(`/laundries/${laundry.model.id}/invite-code`)
          .send()
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(200)
      })

      it('should fail if demo', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        laundry.model.demo = true
        await laundry.model.save()
        await request(app)
          .post(`/laundries/${laundry.model.id}/invite-code`)
          .send()
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(403)
      })

      it('should create code', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .post(`/laundries/${laundry.model.id}/invite-code`)
          .send()
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(200)
        const l = await LaundryHandler
          .lib
          .findFromId(laundry.model._id)
        const {key} = res.body
        assert(base64UrlSafe.validate(key))
        assert(await l.verifyInviteCode(key))
      })

      it('should fail when only user', async () => {
        const [{laundry}, {user, token}] = await Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateTokens(1)])
        await laundry.addUser(user)
        const res = await request(app)
          .post(`/laundries/${laundry.model.id}/invite-code`)
          .send()
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })
    })

    describe('DELETE /laundries/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/laundries/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return 404 on invalid id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .delete('/laundries/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on missing id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .delete('/laundries/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on other id', async () => {
        const [{laundry}, {user, token}] = await Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
        const res = await request(app)
          .delete(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should succeed', async () => {
        const {user, token, laundries} = await dbUtils.populateLaundries(1)
        await request(app)
          .delete(`/laundries/${laundries[0].model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(204)
        const l = await LaundryHandler
          .lib
          .findFromId(laundries[0].model.id)
        assert(!l)
      })

      it('should succeed when administrator', async () => {
        const [{laundries}, {user, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.createAdministrator()])
        await request(app)
          .delete(`/laundries/${laundries[0].model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(204)
        const t = await LaundryHandler
          .lib
          .findFromId(laundries[0].model.id)
        assert(!t)
      })

      it('should fail if demo', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        laundry.model.demo = true
        await laundry.save()
        await request(app)
          .delete(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(403)
      })

      it('should succeed if demo and administrator', async () => {
        const [{laundry}, {user, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateTokens(1)])

        laundry.model.demo = true
        user.model.role = 'admin'
        await laundry.save()
        await user.save()
        await request(app)
          .delete(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(204)
      })

      it('should succeed if administrator', async () => {
        const [{laundry}, {user, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateTokens(1)])
        user.model.role = 'admin'
        await user.save()

        await request(app)
          .delete(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(204)
      })

      it('should fail when only user', async () => {
        const [{laundry}, {user, token}] = await Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
        await laundry.addUser(user)
        const res = await request(app)
          .delete(`/laundries/${laundry.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })
    })

    describe('DELETE /laundries/{id}/owners/{userId}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/laundries/id/owners/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return 404 on invalid id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .delete('/laundries/id/owners/userId')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(404)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on missing id', async () => {
        const [{user, token, laundry}, [user2]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
        await laundry.addUser(user2)
        const res = await request(app)
          .delete(`/laundries/${laundry.model.id}/owners/id`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(404)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on other id', async () => {
        const [{laundry}, {user, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
        const res = await request(app)
          .delete(`/laundries/${laundry.model.id}/owners/id`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(404)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 403 on other user id', async () => {
        const [{user: owner, token, laundry}, [user]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
        const res = await request(app)
          .delete(`/laundries/${laundry.model.id}/owners/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(403)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should return 403 on other user id and owner', async () => {
        const [{user: owner, token, laundries: [laundry1, laundry2]}, [user]] = await Promise.all([dbUtils.populateLaundries(2), dbUtils.populateUsers(1)])
        await laundry2.addOwner(user)
        const res = await request(app)
          .delete(`/laundries/${laundry1.model.id}/owners/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(403)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should fail when not owner', async () => {
        const [{user: owner, token, laundry}, [user]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
        await laundry.addUser(user)
        const res = await request(app)
          .delete(`/laundries/${laundry.model.id}/owners/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(403)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should succeed', async () => {
        const [{user: owner, token, laundry}, [user]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
        await laundry.addOwner(user)
        await request(app)
          .delete(`/laundries/${laundry.model.id}/owners/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(204)
        const l = await LaundryHandler
          .lib
          .findFromId(laundry.model.id)
        assert(!l.isOwner(user))
      })

      it('should succeed when administrator', async () => {
        const [{user: owner, token, laundry}, [user]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
        await laundry.addOwner(user)
        await request(app).delete(`/laundries/${laundry.model.id}/owners/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(204)
        const l = await LaundryHandler
          .lib
          .findFromId(laundry.model.id)
        assert(!l.isOwner(user))
      })

      it('should succeed when removing self', async () => {
        const [{laundry}, {user, token}] = await Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateTokens(1)])
        await laundry.addOwner(user)
        await request(app)
          .delete(`/laundries/${laundry.model.id}/owners/${user.model.id}`)
          .auth(user.model.id, token.secret)
          .expect(204)
      })

      it('should fail when removing last owner', async () => {
        const {laundry, user, token} = await dbUtils
          .populateLaundries(1)
        await request(app)
          .delete(`/laundries/${laundry.model.id}/owners/${user.model.id}`)
          .auth(user.model.id, token.secret)
          .expect(403)
      })

      it('should fail when only user', async () => {
        const [{laundry}, {token, user: user1}, [user2]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateTokens(1), dbUtils.populateUsers(1)])
        await laundry.addUser(user1)
        await laundry.addOwner(user2)

        const res = await request(app)
          .delete(`/laundries/${laundry.model.id}/owners/${user2.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user1.model.id, token.secret)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })
    })

    describe('POST /laundries/{id}/owners/{userId}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .post('/laundries/id/owners/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return 404 on invalid id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .post('/laundries/id/owners/userId')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(404)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on missing id', async () => {
        const [{user: owner, token, laundry}, [user]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
        await laundry.addUser(user)
        const res = await request(app)
          .post(`/laundries/${laundry.model.id}/owners/id`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(404)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on other id', async () => {
        const [{laundry}, {user, token}] = await Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
        const res = await request(app)
          .post(`/laundries/${laundry.model.id}/owners/id`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(404)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 403 on other user id', async () => {
        const [{user: owner, token, laundry}, [user]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
        const res = await request(app)
          .post(`/laundries/${laundry.model.id}/owners/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(403)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should return 403 on other user id and owner', async () => {
        const [{user: owner, token, laundries: [laundry, laundry2]}, [user]] = await Promise.all([dbUtils.populateLaundries(2), dbUtils.populateUsers(1)])
        await laundry2.addOwner(user)
        const res = await request(app)
          .post(`/laundries/${laundry.model.id}/owners/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(403)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should fail when owner', async () => {
        const [{user: owner, token, laundry}, [user]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
        await laundry.addOwner(user)
        const res = await request(app)
          .post(`/laundries/${laundry.model.id}/owners/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(403)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should succeed', async () => {
        const [{user: owner, token, laundry}, [user]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
        await laundry.addUser(user)
        await request(app)
          .post(`/laundries/${laundry.model.id}/owners/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(204)
        const l = await LaundryHandler
          .lib
          .findFromId(laundry.model.id)
        assert(l.isOwner(user))
      })

      it('should succeed when administrator', async () => {
        const [{laundry}, [user], {user: owner, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1), dbUtils.createAdministrator()])
        await laundry.addUser(user)
        await request(app)
          .post(`/laundries/${laundry.model.id}/owners/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(204)
        const l = await LaundryHandler
          .lib
          .findFromId(laundry.model.id)
        assert(l.isOwner(user))
      })

      it('should fail when only user', async () => {
        const [{laundry}, {token, user}, [user2]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateTokens(1), dbUtils.populateUsers(1)])
        await laundry.addUser(user)
        await laundry.addUser(user2)
        const res = await request(app)
          .post(`/laundries/${laundry.model.id}/owners/${user2.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })
    })

    describe('POST /laundries/{id}/users/{userId}', () => {
      it('should fail on not authenticated', async () => {
        await request(app)
          .post('/laundries/{id}/users/{userId}')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401)
      })
      it('should fail on only user', async () => {
        const {user, token, laundry} = await dbUtils.populateLaundries(1)
        const [user2] = await dbUtils.populateUsers(1)
        const res = await request(app)
          .post(`/laundries/${laundry.model.id}/users/${user2.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })
      it('should succeed on web', async () => {
        const {laundry} = await dbUtils.populateLaundries(1)
        const [user2] = await dbUtils.populateUsers(1)
        const token = await signAppToken('https://web.laundree.io', 'https://api.laundree.io')
        await request(app)
          .post(`/laundries/${laundry.model.id}/users/${user2.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${token}`)
          .expect(204)
        const l: LaundryHandler = await LaundryHandler.lib.findFromId(laundry.model.id)
        assert(l.isUser(user2))
      })
      it('should fail on already user', async () => {
        const {laundry} = await dbUtils.populateLaundries(1)
        const [user2] = await dbUtils.populateUsers(1)
        await laundry.addUser(user2)
        const token = await signAppToken('https://web.laundree.io', 'https://api.laundree.io')
        await request(app)
          .post(`/laundries/${laundry.model.id}/users/${user2.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${token}`)
          .expect(403)
      })
    })

    describe('DELETE /laundries/{id}/users/{userId}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/laundries/id/users/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return 404 on invalid id', async () => {
        const {user, token} = await dbUtils.populateLaundries(1)
        const res = await request(app)
          .delete('/laundries/id/users/userId')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(404)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on missing id', async () => {
        const [{laundry}, [user], {user: owner, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1), dbUtils.createAdministrator()])
        await laundry.addUser(user)
        const res = await request(app)
          .delete(`/laundries/${laundry.model.id}/users/id`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(404)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 404 on other id', async () => {
        const [{laundry}, {user, token}] = await Promise
          .all([dbUtils.populateLaundries(1), dbUtils.populateLaundries(1)])
        const res = await request(app)
          .delete(`/laundries/${laundry.model.id}/users/id`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(404)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should return 403 on other user id', async () => {
        const [{user: owner, token, laundry}, [user]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
        const res = await request(app)
          .delete(`/laundries/${laundry.model.id}/users/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(403)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should succeed', async () => {
        const [{user: owner, token, laundry}, [user]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
        await laundry.addUser(user)
        await request(app)
          .delete(`/laundries/${laundry.model.id}/users/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(204)
        const l = await LaundryHandler
          .lib
          .findFromId(laundry.model.id)
        assert(!l.isUser(user))
      })

      it('should succeed when administrator', async () => {
        const [{laundry}, [user], {user: owner, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1), dbUtils.createAdministrator()])
        await laundry.addUser(user)
        await request(app)
          .delete(`/laundries/${laundry.model.id}/users/${user.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(owner.model.id, token.secret)
          .expect(204)
        const l = await LaundryHandler
          .lib
          .findFromId(laundry.model.id)
        assert(!l.isUser(user))
      })

      it('should fail when administrator but user is owner', async () => {
        const [{laundry, user: owner}, {user, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.createAdministrator()])
        await request(app)
          .delete(`/laundries/${laundry.model.id}/users/${owner.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(403)
      })

      it('should succeed and remove bookings', async () => {
        const [{laundry, user: owner, token, machine}, [user]] = await Promise.all([dbUtils.populateMachines(1), dbUtils.populateUsers(1)])
        await laundry.addUser(user)
        const booking = await machine.createBooking(
          user,
          Date.now() + 60 * 60 * 1000,
          Date.now() + 2 * 60 * 60 * 1000)
        await request(app)
          .delete(`/laundries/${laundry.model.id}/users/${user.model.id}`)
          .auth(owner.model.id, token.secret)
          .expect(204)
        const b = await BookingHandler
          .lib
          .findFromId(booking.model._id)
        assert(!b)
      })

      it('should succeed when removing self', async () => {
        const [{laundry}, {user, token}] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateTokens(1)])
        await laundry.addUser(user)
        await request(app)
          .delete(`/laundries/${laundry.model.id}/users/${user.model.id}`)
          .auth(user.model.id, token.secret)
          .expect(204)
      })

      it('should fail when only user', async () => {
        const [{laundry}, {token, user}, [user2]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateTokens(1), dbUtils.populateUsers(1)])
        await laundry.addUser(user)
        await laundry.addUser(user2)
        const res = await request(app)
          .delete(`/laundries/${laundry.model.id}/users/${user2.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })

      it('should fail when deleting owner', async () => {
        const [{laundry, token, user}, [user2]] = await Promise.all([dbUtils.populateLaundries(1), dbUtils.populateUsers(1)])
        await laundry.addOwner(user2)
        const res = await request(app)
          .delete(`/laundries/${laundry.model.id}/users/${user2.model.id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(403)
        assert.deepEqual(res.body, {message: 'Not allowed'})
      })
    })
  })
})
