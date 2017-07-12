// @flow
import request from 'supertest'
import { app, promise } from '../../../../test_target/app'
import config from 'config'
import BookingHandler from '../../../../test_target/handlers/booking'
import * as dbUtils from '../../../db_utils'
import moment from 'moment-timezone'
import assert from 'assert'

function createDateTomorrow (hour = 0, minute = 0, tz = config.timezone) {
  const now = moment.tz(tz).add(2, 'd')
  return {year: now.year(), month: now.month(), day: now.date(), hour, minute}
}

function createDateDayAfterTomorrow (hour = 0, minute = 0, tz = config.timezone) {
  const now = moment.tz(tz).add(3, 'd')
  return {year: now.year(), month: now.month(), day: now.date(), hour, minute}
}

function createDateYesterday (hour = 0, minute = 0, tz = config.timezone) {
  const now = moment.tz(tz).subtract(1, 'd')
  return {year: now.year(), month: now.month(), day: now.date(), hour, minute}
}

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('bookings', function () {
    this.timeout(5000)
    describe('GET /api/machines/{id}/bookings', () => {
      it('should fail on not authenticated', async () => {
        const {machine} = await dbUtils.populateMachines(1)
        await request(await promise)
          .get(`/api/machines/${machine.model.id}/bookings`)
          .set('Accept', 'application/json')
          .expect(403)
          .expect('Content-Type', /json/)
      })

      it('should limit output size', async () => {
        const {user, token, machine, bookings} = await dbUtils.populateBookings(50)
        const res = await request(app)
          .get(`/api/machines/${machine.model.id}/bookings`)
          .set('Accept', 'application/json')
          .query({from: 0, to: Date.now()})
          .auth(user.model.id, token.secret)
          .expect(200)
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
        const arr = bookings.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)).slice(0, 10).map((machine) => machine.toRestSummary())
        assert.deepEqual(res.body, arr)
      })

      it('should query range', async () => {
        const {user, token, machine, bookings} = await dbUtils.populateBookings(50)
        const res = await request(app)
          .get(`/api/machines/${machine.model.id}/bookings`)
          .set('Accept', 'application/json')
          .query({from: bookings[5].model.from.getTime(), to: bookings[8].model.to.getTime() + 1})
          .auth(user.model.id, token.secret)
          .expect(200)
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
        const arr = bookings.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)).slice(5, 9).map((machine) => machine.toRestSummary())
        assert.deepEqual(res.body, arr)
      })

      it('should query range exclusive', async () => {
        const {user, token, machine, bookings} = await dbUtils.populateBookings(50)
        const res = await request(app)
          .get(`/api/machines/${machine.model.id}/bookings`)
          .set('Accept', 'application/json')
          .query({from: bookings[5].model.from.getTime(), to: bookings[8].model.from.getTime()})
          .auth(user.model.id, token.secret)
          .expect(200)
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
        const arr = bookings.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)).slice(5, 8).map((machine) => machine.toRestSummary())
        assert.deepEqual(res.body, arr)
      })

      it('fail on wrong machine id', async () => {
        const {user, token} = await dbUtils.populateBookings(50)
        const res = await request(app)
          .get('/api/machines/foo/bookings')
          .set('Accept', 'application/json')
          .query({from: 0, to: Date.now()})
          .auth(user.model.id, token.secret)
          .expect(404)
          .expect('Content-Type', /json/)
        assert.deepEqual(res.body, {message: 'Not found'})
      })

      it('should allow custom output size', async () => {
        const {user, token, bookings, machine} = await dbUtils.populateBookings(50)
        const res = await request(app)
          .get(`/api/machines/${machine.model.id}/bookings`)
          .query({page_size: 12, from: 0, to: Date.now()})
          .auth(user.model.id, token.secret)
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
        const arr = bookings.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).slice(0, 12).map((booking) => booking.toRestSummary())
        assert.deepEqual(res.body, arr)
      })

      it('should only fetch from current machine', async () => {
        const [{user, token, bookings, machine}] = await Promise.all([dbUtils.populateBookings(2), dbUtils.populateBookings(1)])
        const res = await request(app)
          .get(`/api/machines/${machine.model.id}/bookings`)
          .auth(user.model.id, token.secret)
          .query({from: 0, to: Date.now()})
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
        const arr = bookings.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map((machine) => machine.toRestSummary())
        assert.deepEqual(res.body, arr)
      })

      it('should only fetch from own machine', () =>
        Promise.all([dbUtils.populateBookings(1), dbUtils.populateBookings(2)])
          .then(([{machine}, {user, token}]) =>
            request(app)
              .get(`/api/machines/${machine.model.id}/bookings`)
              .auth(user.model.id, token.secret)
              .query({from: 0, to: Date.now()})
              .set('Accept', 'application/json')
              .expect(404)
              .expect('Content-Type', /json/)
              .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should allow since', () =>
        dbUtils.populateBookings(50).then(({machine, user, token, bookings}) => {
          bookings = bookings.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id))
          return request(app)
            .get(`/api/machines/${machine.model.id}/bookings`)
            .query({since: bookings[24].model.id, page_size: 1, from: 0, to: Date.now()})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .then(res => {
              assert.deepEqual(res.body, [bookings[25].toRestSummary()])
            })
        }))
    })

    describe('POST /api/machines/{lid}/bookings', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .post('/api/machines/lid1/bookings')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should fail on invalid from', () =>
        dbUtils.populateBookings(1).then(({user, token, machine}) =>
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({from: createDateTomorrow(12), to: createDateTomorrow(26)})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)))

      it('should fail on invalid date', async () => {
        const {user, token, machine} = await dbUtils.populateBookings(1)
        const result = await request(app)
          .post(`/api/machines/${machine.model.id}/bookings`)
          .send({from: {}, to: createDateTomorrow()})
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(400)
        assert.deepEqual(result.body, {message: 'Request validation failed: Parameter (body) failed schema validation'})
      })

      it('should fail on invalid to', () =>
        dbUtils.populateBookings(1).then(({user, token, machine, bookings}) =>
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({to: {}, from: createDateTomorrow()})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)))

      it('should fail from after to', () =>
        dbUtils.populateBookings(1).then(({user, token, machine, bookings}) =>
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({to: createDateTomorrow(12), from: createDateTomorrow(13)})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => assert.deepEqual(res.body, {message: 'From must be before to'}))))

      it('should fail from on to', () =>
        dbUtils.populateBookings(1).then(({user, token, machine, bookings}) => {
          return request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({to: createDateTomorrow(12), from: createDateTomorrow(12)})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => assert.deepEqual(res.body, {message: 'From must be before to'}))
        }))

      it('should fail if before limit', () =>
        dbUtils
          .populateBookings(1)
          .then(({user, token, machine, bookings, laundry}) =>
            laundry
              .updateLaundry({
                rules: {
                  timeLimit: {
                    from: {hour: 12, minute: 0},
                    to: {hour: 24, minute: 0}
                  }
                }
              })
              .then(() => ({laundry, user, token, machine, bookings})))
          .then(({user, token, machine, bookings}) => request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({to: createDateTomorrow(13), from: createDateTomorrow(0)})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => assert.deepEqual(res.body, {message: 'Time limit violation'}))))

      it('should fail if after limit', () =>
        dbUtils
          .populateBookings(1)
          .then(({user, token, machine, bookings, laundry}) =>
            laundry
              .updateLaundry({
                rules: {
                  timeLimit: {
                    from: {hour: 0, minute: 0},
                    to: {hour: 12, minute: 0}
                  }
                }
              })
              .then(() => ({laundry, user, token, machine, bookings})))
          .then(({user, token, machine, bookings}) => request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({to: createDateTomorrow(13), from: createDateTomorrow(0)})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => assert.deepEqual(res.body, {message: 'Time limit violation'}))))

      it('should fail if daily limit', () =>
        dbUtils
          .populateMachines(1)
          .then(({user, token, laundry, machine}) => Promise
            .all([
              laundry.updateLaundry({rules: {dailyLimit: 1}}),
              laundry.createBooking(machine, user, createDateTomorrow(1), createDateTomorrow(2))
            ]).then(() => ({
              user,
              token,
              laundry,
              machine
            })))
          .then(({machine, user, token}) => request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({from: createDateTomorrow(3), to: createDateTomorrow(4)})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => assert.deepEqual(res.body, {message: 'Daily limit violation'}))))

      it('should succeed other bookings on other laundry', () => Promise
        .all([dbUtils.populateMachines(1), dbUtils.populateMachines(1)])
        .then(([{laundry: otherLaundry, machine: otherMachine}, {machine, laundry, user, token}]) =>
          otherLaundry
            .createBooking(otherMachine, user, createDateTomorrow(1), createDateTomorrow(2))
            .then(() => laundry.updateLaundry({rules: {dailyLimit: 1}}))
            .then(() => ({machine, laundry, user, token})))
        .then(({machine, user, token}) => request(app)
          .post(`/api/machines/${machine.model.id}/bookings`)
          .send({from: createDateTomorrow(0), to: createDateTomorrow(1)})
          .auth(user.model.id, token.secret)
          .expect(200)))

      it('should fail if limit', () =>
        dbUtils
          .populateMachines(1)
          .then(({user, token, laundry, machine}) => Promise
            .all([
              laundry.updateLaundry({rules: {limit: 1}}),
              laundry.createBooking(machine, user, createDateTomorrow(1), createDateTomorrow(2))
            ]).then(() => ({
              user,
              token,
              laundry,
              machine
            })))
          .then(({machine, user, token}) => request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({from: createDateDayAfterTomorrow(3), to: createDateDayAfterTomorrow(4)})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => assert.deepEqual(res.body, {message: 'Limit violation'}))))

      it('should succeed other bookings on other laundry', () => Promise
        .all([dbUtils.populateMachines(1), dbUtils.populateMachines(1)])
        .then(([{laundry: otherLaundry, machine: otherMachine}, {machine, laundry, user, token}]) =>
          otherLaundry
            .createBooking(otherMachine, user, createDateTomorrow(1), createDateTomorrow(2))
            .then(() => laundry.updateLaundry({rules: {limit: 1}}))
            .then(() => ({machine, laundry, user, token})))
        .then(({machine, user, token}) => request(app)
          .post(`/api/machines/${machine.model.id}/bookings`)
          .send({from: createDateTomorrow(0), to: createDateTomorrow(1)})
          .auth(user.model.id, token.secret)
          .expect(200)))

      it('should fail on double booking', () =>
        dbUtils.createBooking(createDateTomorrow(1), createDateTomorrow(2))
          .then(({user, token, machine, booking, offset}) =>
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({from: createDateTomorrow(0, 30), to: createDateTomorrow(1, 30)})
              .set('Accept', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(409)
              .then(res => assert.deepEqual(res.body, {message: 'Machine not available'}))))

      it('should fail on double booking 2', () =>
        dbUtils.createBooking(createDateTomorrow(1), createDateTomorrow(2))
          .then(({user, token, machine, booking, offset}) =>
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({from: createDateTomorrow(1, 30), to: createDateTomorrow(3)})
              .set('Accept', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(409)
              .then(res => assert.deepEqual(res.body, {message: 'Machine not available'}))))

      it('should fail on double booking 3', () =>
        dbUtils.createBooking(createDateTomorrow(1), createDateTomorrow(3))
          .then(({user, token, machine, booking, offset}) =>
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({from: createDateTomorrow(1, 30), to: createDateTomorrow(2, 30)})
              .set('Accept', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(409)
              .then(res => assert.deepEqual(res.body, {message: 'Machine not available'}))))

      it('should fail on double booking 4', () =>
        dbUtils.createBooking(createDateTomorrow(1), createDateTomorrow(2))
          .then(({user, token, machine, booking}) =>
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({from: createDateTomorrow(0, 30), to: createDateTomorrow(2, 30)})
              .set('Accept', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(409)
              .then(res => assert.deepEqual(res.body, {message: 'Machine not available'}))))
      it('should succeed on tight booking 1', () =>
        dbUtils.createBooking(createDateTomorrow(1), createDateTomorrow(2))
          .then(({user, token, machine, bookings}) =>
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({from: createDateTomorrow(2, 0), to: createDateTomorrow(2, 30)})
              .set('Accept', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(200)
              .then(res => {
                assert.deepEqual(res.body.from, createDateTomorrow(1, 0))
                assert.deepEqual(res.body.to, createDateTomorrow(2, 30))
              })))
      it('should succeed on tight booking 2', () =>
        dbUtils.createBooking(createDateTomorrow(1), createDateTomorrow(2))
          .then(({user, token, machine, bookings}) =>
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({from: createDateTomorrow(0, 30), to: createDateTomorrow(1)})
              .set('Accept', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(200)
              .then(res => {
                assert.deepEqual(res.body.from, createDateTomorrow(0, 30))
                assert.deepEqual(res.body.to, createDateTomorrow(2))
              })))

      it('should fail on non % 30 minutes', () => dbUtils.populateMachines(1)
        .then(({machine, user, token}) => request(app)
          .post(`/api/machines/${machine.model.id}/bookings`)
          .send({from: createDateTomorrow(2, 0), to: createDateTomorrow(2, 1)})
          .auth(user.model.id, token.secret)
          .expect(400)))

      it('should fail on non cross-day booking', () => dbUtils.populateMachines(1)
        .then(({machine, user, token}) => request(app)
          .post(`/api/machines/${machine.model.id}/bookings`)
          .send({from: createDateTomorrow(2), to: createDateDayAfterTomorrow(2)})
          .auth(user.model.id, token.secret)
          .expect(400)))

      it('should fail on broken machine', () => dbUtils.populateMachines(1)
        .then(({machine, user, token}) => machine.update({broken: true}).then(() => ({machine, user, token})))
        .then(({machine, user, token}) => request(app)
          .post(`/api/machines/${machine.model.id}/bookings`)
          .send({from: createDateTomorrow(1), to: createDateTomorrow(2)})
          .auth(user.model.id, token.secret)
          .expect(400)))

      it('should succeed on midnight booking', () => dbUtils.populateMachines(1)
        .then(({machine, user, token}) => request(app)
          .post(`/api/machines/${machine.model.id}/bookings`)
          .send({from: createDateTomorrow(23), to: createDateTomorrow(24)})
          .auth(user.model.id, token.secret)
          .expect(200)))

      it('should succeed on midnight booking', () => dbUtils.populateMachines(1)
        .then(({machine, user, token}) => request(app)
          .post(`/api/machines/${machine.model.id}/bookings`)
          .send({from: createDateTomorrow(0), to: createDateTomorrow(1)})
          .auth(user.model.id, token.secret)
          .expect(200)))

      it('should not merge tight booking from other user', () =>
        Promise.all([dbUtils.populateTokens(1), dbUtils.createBooking(createDateTomorrow(1), createDateTomorrow(2))])
          .then(([{user, token}, {laundry, machine, bookings}]) =>
            laundry.addUser(user).then(() =>
              request(app)
                .post(`/api/machines/${machine.model.id}/bookings`)
                .send({
                  from: createDateTomorrow(2),
                  to: createDateTomorrow(3)
                })
                .set('Accept', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(res => {
                  assert.deepEqual(res.body.from, createDateTomorrow(2))
                  assert.deepEqual(res.body.to, createDateTomorrow(3))
                }))))

      it('should not merge tight on other day', () =>
        dbUtils.createBooking(createDateTomorrow(23), createDateTomorrow(24))
          .then(({user, token, laundry, machine, bookings}) =>
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({
                from: createDateDayAfterTomorrow(0),
                to: createDateDayAfterTomorrow(1)
              })
              .set('Accept', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(200)
              .then(res => {
                assert.deepEqual(res.body.from, createDateDayAfterTomorrow(0))
                assert.deepEqual(res.body.to, createDateDayAfterTomorrow(1))
              })))

      it('should fail on no such machine', () =>
        dbUtils.populateTokens(1)
          .then(({user, token}) =>
            request(app)
              .post('/api/machines/foo/bookings')
              .send({name: 'Machine 2000'})
              .set('Accept', 'application/json')
              .send({from: createDateTomorrow(1), to: createDateTomorrow(2)})
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should only fetch from own machine', () =>
        Promise.all([dbUtils.populateBookings(1), dbUtils.populateBookings(2)])
          .then(([{machine}, {user, token}]) => request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({from: createDateTomorrow(1), to: createDateTomorrow(2)})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect(404)
            .expect('Content-Type', /json/)
            .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should succeed when user', () =>
        Promise
          .all([dbUtils.populateBookings(1), dbUtils.populateBookings(2)])
          .then(([{laundry, machine}, {user, token}]) =>
            laundry.addUser(user).then(() =>
              request(app)
                .post(`/api/machines/${machine.model.id}/bookings`)
                .send({from: createDateTomorrow(1), to: createDateTomorrow(2)})
                .auth(user.model.id, token.secret)
                .set('Accept', 'application/json')
                .expect(200)
                .expect('Content-Type', /json/)
                .then(res => {
                  const id = res.body.id
                  return BookingHandler.lib.findFromId(id).then((machine) => {
                    assert(machine)
                    return machine.toRest().then((result) => assert.deepEqual(res.body, result))
                  })
                }))))

      it('should succeed', () =>
        dbUtils.populateBookings(1).then(({user, token, machine, bookings}) =>
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({from: createDateTomorrow(1), to: createDateTomorrow(2)})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
              const id = res.body.id
              return BookingHandler.lib.findFromId(id).then((machine) => {
                assert(machine)
                assert.deepEqual(res.body.from, createDateTomorrow(1))
                assert.deepEqual(res.body.to, createDateTomorrow(2))
                return machine.toRest().then((result) => assert.deepEqual(res.body, result))
              })
            })))

      it('should succeed on different timezone', () =>
        dbUtils.populateBookings(1).then(({laundry, user, token, machine, bookings}) =>
          laundry.updateLaundry({timezone: 'Pacific/Chatham'})
            .then(() =>
              request(app)
                .post(`/api/machines/${machine.model.id}/bookings`)
                .send({
                  from: createDateTomorrow(1, 0, laundry.timezone()),
                  to: createDateTomorrow(2, 0, laundry.timezone())
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(res => {
                  const id = res.body.id
                  return BookingHandler.lib.findFromId(id).then((machine) => {
                    assert(machine)
                    assert.deepEqual(res.body.from, createDateTomorrow(1, 0, laundry.timezone()))
                    assert.deepEqual(res.body.to, createDateTomorrow(2, 0, laundry.timezone()))
                    return machine.toRest().then((result) => assert.deepEqual(res.body, result))
                  })
                }))))

      it('should fail on too soon booking', () =>
        dbUtils.populateMachines(1).then(({user, token, machine}) =>
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({from: createDateYesterday(1), to: createDateTomorrow(2)})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => assert.deepEqual(res.body, {message: 'Too soon'}))))
    })

    describe('GET /bookings/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .get('/api/bookings/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateBookings(1).then(({user, token}) =>
          request(app)
            .get('/api/bookings/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateBookings(1).then(({user, token}) =>
          request(app)
            .get('/api/bookings/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should return 404 on other id', () =>
        Promise
          .all([dbUtils.populateBookings(1), dbUtils.populateBookings(1)])
          .then(([{booking}, {user, token}]) =>
            request(app)
              .get(`/api/bookings/${booking.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should succeed', () =>
        dbUtils.populateBookings(1).then(({user, token, booking}) =>
          request(app)
            .get(`/api/bookings/${booking.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res =>
              booking.toRest().then((result) => assert.deepEqual(res.body, result)))))

      it('should succeed when only user', () =>
        Promise
          .all([dbUtils.populateTokens(1), dbUtils.populateBookings(1)])
          .then(([{user, token}, {booking, laundry}]) =>
            laundry.addUser(user)
              .then(() =>
                request(app)
                  .get(`/api/bookings/${booking.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect('Content-Type', /json/)
                  .expect(200)
                  .then(res => booking.toRest().then((result) => assert.deepEqual(res.body, result))))))
    })

    describe('DELETE /bookings/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/api/bookings/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', async () => {
        const {user, token} = await dbUtils.populateBookings(1)
        const res = await request(app)
          .delete('/api/bookings/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .auth(user.model.id, token.secret)
          .expect('Content-Type', /json/)
          .expect(404)
        assert.deepEqual(res.body, {message: 'Not found'})
      })
      it('should return 404 on missing id', () =>
        dbUtils.populateBookings(1).then(({user, token, bookings}) =>
          request(app)
            .delete('/api/bookings/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should return 404 on other id', () =>
        Promise
          .all([dbUtils.populateBookings(1), dbUtils.populateBookings(1)])
          .then(([{booking}, {user, token}]) =>
            request(app)
              .delete(`/api/bookings/${booking.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should succeed', () =>
        dbUtils.populateBookings(1).then(({user, token, booking}) =>
          request(app)
            .delete(`/api/bookings/${booking.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .then(res => BookingHandler
              .lib
              .findFromId(booking.model.id)
              .then((t) => {
                assert(!t)
              }))))

      it('should fail when other user', () =>
        Promise
          .all([dbUtils.populateTokens(1), dbUtils.populateBookings(1)])
          .then(([{user, token}, {booking, laundry}]) =>
            dbUtils.populateBookings(1).then(({booking, laundry}) =>
              laundry.addUser(user)
                .then(() =>
                  request(app)
                    .delete(`/api/bookings/${booking.model.id}`)
                    .set('Accept', 'application/json')
                    .set('Content-Type', 'application/json')
                    .auth(user.model.id, token.secret)
                    .expect('Content-Type', /json/)
                    .expect(403)
                    .then(res => assert.deepEqual(res.body, {message: 'Not allowed'}))))))

      it('should succeed when laundry owner', () =>
        Promise
          .all([dbUtils.populateMachines(1), dbUtils.populateUsers(1)])
          .then(([{user, token, laundry, machine}, [minion]]) =>
            laundry
              .addUser(minion)
              .then(() => machine.createBooking(minion, new Date(), new Date(Date.now() + 300)))
              .then((booking) =>
                request(app)
                  .delete(`/api/bookings/${booking.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect(204))))

      it('should succeed when not laundry owner but booking owner', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateTokens(1)])
          .then(([{laundry, machine}, {user, token}]) => laundry
            .addUser(user)
            .then(() => machine.createBooking(user, new Date(), new Date(Date.now() + 300)))
            .then((booking) =>
              request(app)
                .delete(`/api/bookings/${booking.model.id}`)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .auth(user.model.id, token.secret)
                .expect(204))))
    })
    describe('PUT /bookings/{id}', () => {
      it('should fail on not found', async () => {
        const {user, token} = await dbUtils.populateTokens(1)
        await request(app)
          .put('/api/bookings/nonExistingId')
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(404)
      })
      it('should fail on authorized', async () => {
        await request(app)
          .put('/api/bookings/nonExistingId')
          .set('Accept', 'application/json')
          .expect(403)
      })
      it('should fail on not owner', async () => {
        const {booking} = await dbUtils.populateBookings(1)
        const {user, token} = await dbUtils.populateTokens(1)
        await request(app)
          .put(`/api/bookings/${booking.model.id}`)
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .expect(404)
      })
      it('should succeed on empty body', async () => {
        const {booking, user, token} = await dbUtils.populateBookings(1)
        await request(app)
          .put(`/api/bookings/${booking.model.id}`)
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .send({})
          .expect(204)
      })
      it('should fail on new from before old from', async () => {
        const {booking, user, token, laundry} = await dbUtils.populateBookings(1)
        const newFrom = booking.model.from.getTime() - 30 * 60 * 1000
        const res = await request(app)
          .put(`/api/bookings/${booking.model.id}`)
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .send({from: laundry.dateToObject(new Date(newFrom))})
          .expect(400)
        assert.deepEqual(res.body, {message: 'Invalid input'})
      })
      it('should fail on new to after old to', async () => {
        const {booking, user, token, laundry} = await dbUtils.populateBookings(1)
        const newTo = booking.model.to.getTime() + 30 * 60 * 1000
        const res = await request(app)
          .put(`/api/bookings/${booking.model.id}`)
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .send({to: laundry.dateToObject(new Date(newTo))})
          .expect(400)
        assert.deepEqual(res.body, {message: 'Invalid input'})
      })
      it('should fail on new to after old to and old from before from', async () => {
        const {booking, user, token, laundry} = await dbUtils.populateBookings(1)
        const newTo = booking.model.to.getTime() + 30 * 60 * 1000
        const newFrom = booking.model.from.getTime() - 30 * 60 * 1000
        const res = await request(app)
          .put(`/api/bookings/${booking.model.id}`)
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .send({to: laundry.dateToObject(new Date(newTo)), from: laundry.dateToObject(new Date(newFrom))})
          .expect(400)
        assert.deepEqual(res.body, {message: 'Invalid input'})
      })
      it('should update on new from after old from', async () => {
        const {booking, user, token, laundry} = await dbUtils.populateBookings(1)
        const newFrom = booking.model.from.getTime() + 60 * 60 * 1000
        await request(app)
          .put(`/api/bookings/${booking.model.id}`)
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .send({from: laundry.dateToObject(new Date(newFrom))})
          .expect(204)
        const newBooking = await BookingHandler.lib.findFromId(booking.model.id)
        assert.equal(newFrom, newBooking.model.from.getTime())
      })
      it('should update on new to before old to', async () => {
        const {booking, user, token, laundry} = await dbUtils.populateBookings(1)
        const newTo = booking.model.to.getTime() - 60 * 60 * 1000
        await request(app)
          .put(`/api/bookings/${booking.model.id}`)
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .send({to: laundry.dateToObject(new Date(newTo))})
          .expect(204)
        const newBooking = await BookingHandler.lib.findFromId(booking.model.id)
        assert.equal(newTo, newBooking.model.to.getTime())
      })
      it('should update on new to before old to and old from after from', async () => {
        const {booking, user, token, laundry} = await dbUtils.populateBookings(1)
        const newTo = booking.model.to.getTime() - 30 * 60 * 1000
        const newFrom = booking.model.from.getTime() + 30 * 60 * 1000
        await request(app)
          .put(`/api/bookings/${booking.model.id}`)
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .send({to: laundry.dateToObject(new Date(newTo)), from: laundry.dateToObject(new Date(newFrom))})
          .expect(204)
        const newBooking = await BookingHandler.lib.findFromId(booking.model.id)
        assert.equal(newFrom, newBooking.model.from.getTime())
        assert.equal(newTo, newBooking.model.to.getTime())
      })
      it('should fail on new from after old to', async () => {
        const {booking, user, token, laundry} = await dbUtils.populateBookings(1)
        const newFrom = booking.model.to.getTime()
        const res = await request(app)
          .put(`/api/bookings/${booking.model.id}`)
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .send({from: laundry.dateToObject(new Date(newFrom))})
          .expect(400)
        assert.deepEqual(res.body, {message: 'Invalid input'})
      })
      it('should fail on new to before old from', async () => {
        const {booking, user, token, laundry} = await dbUtils.populateBookings(1)
        const newTo = booking.model.from.getTime()
        const res = await request(app)
          .put(`/api/bookings/${booking.model.id}`)
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .send({to: laundry.dateToObject(new Date(newTo))})
          .expect(400)
        assert.deepEqual(res.body, {message: 'Invalid input'})
      })

      it('should fail on new to after old to and old from before from', async () => {
        const {booking, user, token, laundry} = await dbUtils.populateBookings(1)
        const newTo = booking.model.to.getTime() - 60 * 60 * 1000
        const newFrom = booking.model.from.getTime() + 60 * 60 * 1000
        const res = await request(app)
          .put(`/api/bookings/${booking.model.id}`)
          .set('Accept', 'application/json')
          .auth(user.model.id, token.secret)
          .send({to: laundry.dateToObject(new Date(newTo)), from: laundry.dateToObject(new Date(newFrom))})
          .expect(400)
        assert.deepEqual(res.body, {message: 'Invalid input'})
      })
    })
  })
})
