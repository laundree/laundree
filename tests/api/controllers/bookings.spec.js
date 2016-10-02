const request = require('supertest-as-promised')
const app = require('../../../app').app
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()
const assert = chai.assert
const {BookingHandler} = require('../../../handlers')
const dbUtils = require('../../db_utils')
const Promise = require('promise')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('bookings', function () {
    this.timeout(5000)
    describe('GET /api/machines/{id}/bookings', () => {
      it('should fail on not authenticated', () =>
        dbUtils.populateMachines(1).then(({machine}) => request(app)
          .get(`/api/machines/${machine.model.id}/bookings`)
          .set('Accept', 'application/json')
          .expect(403)
          .expect('Content-Type', /json/)))

      it('should limit output size', () =>
        dbUtils.populateBookings(50).then(({user, token, machine, bookings}) =>
          request(app)
            .get(`/api/machines/${machine.model.id}/bookings`)
            .set('Accept', 'application/json')
            .query({from: 0, to: Date.now()})
            .auth(user.model.id, token.secret)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .then(res => {
              var arr = bookings.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)).slice(0, 10).map((machine) => machine.toRestSummary())
              res.body.should.deep.equal(arr)
            })))

      it('should query range', () =>
        dbUtils.populateBookings(50).then(({user, token, machine, bookings}) =>
          request(app)
            .get(`/api/machines/${machine.model.id}/bookings`)
            .set('Accept', 'application/json')
            .query({from: bookings[5].model.from.getTime(), to: bookings[8].model.to.getTime() + 1})
            .auth(user.model.id, token.secret)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .then(res => {
              var arr = bookings.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)).slice(5, 9).map((machine) => machine.toRestSummary())
              res.body.should.deep.equal(arr)
            })))

      it('should query range exclusive', () =>
        dbUtils.populateBookings(50).then(({user, token, machine, bookings}) =>
          request(app)
            .get(`/api/machines/${machine.model.id}/bookings`)
            .set('Accept', 'application/json')
            .query({from: bookings[5].model.from.getTime(), to: bookings[8].model.from.getTime()})
            .auth(user.model.id, token.secret)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .then(res => {
              var arr = bookings.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)).slice(5, 8).map((machine) => machine.toRestSummary())
              res.body.should.deep.equal(arr)
            })))

      it('fail on wrong machine id', () =>
        dbUtils.populateBookings(50).then(({user, token}) =>
          request(app)
            .get('/api/machines/foo/bookings')
            .set('Accept', 'application/json')
            .query({from: 0, to: Date.now()})
            .auth(user.model.id, token.secret)
            .expect(404)
            .expect('Content-Type', /json/)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should allow custom output size', () =>
        dbUtils.populateBookings(50).then(({user, token, bookings, machine}) =>
          request(app)
            .get(`/api/machines/${machine.model.id}/bookings`)
            .query({page_size: 12, from: 0, to: Date.now()})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .then(res => {
              var arr = bookings.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).slice(0, 12).map((booking) => booking.toRestSummary())
              res.body.should.deep.equal(arr)
            })))

      it('should only fetch from current machine', () =>
        Promise.all([dbUtils.populateBookings(1), dbUtils.populateBookings(2)])
          .then(([r1, {user, token, bookings, machine}]) =>
            request(app)
              .get(`/api/machines/${machine.model.id}/bookings`)
              .auth(user.model.id, token.secret)
              .query({from: 0, to: Date.now()})
              .set('Accept', 'application/json')
              .expect(200)
              .expect('Content-Type', /json/)
              .expect('Link', /rel=.first./)
              .then(res => {
                var arr = bookings.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map((machine) => machine.toRestSummary())
                res.body.should.deep.equal(arr)
              })))

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
              .then(res => res.body.should.deep.equal({message: 'Not found'}))))

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
              res.body.should.deep.equal([bookings[25].toRestSummary()])
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
            .send({from: 'invalid date', to: new Date()})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)))

      it('should fail on invalid to', () =>
        dbUtils.populateBookings(1).then(({user, token, machine, bookings}) =>
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({to: 'invalid date', from: new Date()})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)))

      it('should fail from after to', () =>
        dbUtils.populateBookings(1).then(({user, token, machine, bookings}) =>
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({to: new Date(0), from: new Date()})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => res.body.should.deep.equal({message: 'From must be before to'}))))

      it('should fail from on to', () =>
        dbUtils.populateBookings(1).then(({user, token, machine, bookings}) => {
          const date = new Date()
          return request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({to: date, from: date})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => res.body.should.deep.equal({message: 'From must be before to'}))
        }))

      it('should fail on double booking', () =>
        dbUtils.populateBookings(3, {offset: Date.now() + 60 * 60 * 1000})
          .then(({user, token, machine, booking, offset}) =>
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({to: new Date(booking.model.from.getTime() + 2), from: new Date(offset)})
              .set('Accept', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(409)
              .then(res => res.body.should.deep.equal({message: 'Machine not available'}))))

      it('should fail on double booking 2', () =>
        dbUtils.populateBookings(3, {offset: Date.now() + 60 * 60 * 1000})
          .then(({user, token, machine, booking, offset}) =>
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({to: new Date(booking.model.to.getTime() + 2), from: new Date(offset)})
              .set('Accept', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(409)
              .then(res => res.body.should.deep.equal({message: 'Machine not available'}))))

      it('should fail on double booking 3', () =>
        dbUtils.populateBookings(3, {offset: Date.now() + 60 * 60 * 1000})
          .then(({user, token, machine, booking, offset}) =>
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({to: new Date(booking.model.to.getTime() + 2), from: new Date(offset + 2)})
              .set('Accept', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(409)
              .then(res => res.body.should.deep.equal({message: 'Machine not available'}))))

      it('should fail on double booking 4', () =>
        dbUtils.populateBookings(3, {offset: Date.now() + 60 * 60 * 1000})
          .then(({user, token, machine, booking}) =>
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({to: new Date(booking.model.to.getTime() + 2), from: new Date(booking.model.from.getTime() - 2)})
              .set('Accept', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(409)
              .then(res => res.body.should.deep.equal({message: 'Machine not available'}))))

      it('should succeed on tight booking', () =>
        dbUtils.populateBookings(3, {offset: Date.now() + 60 * 60 * 1000})
          .then(({user, token, machine, bookings}) =>
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({
                from: bookings[1].model.to,
                to: bookings[2].model.from
              })
              .set('Accept', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(200)
              .then(res => {
                res.body.from.should.equal(bookings[1].model.from.toISOString())
                res.body.to.should.equal(bookings[2].model.to.toISOString())
              })))

      it('should not merge tight booking from other user', () =>
        Promise.all([dbUtils.populateTokens(1), dbUtils.populateBookings(3, {offset: Date.now() + 60 * 60 * 1000})])
          .then(([{user, token}, {laundry, machine, bookings}]) =>
            laundry.addUser(user).then(() =>
              request(app)
                .post(`/api/machines/${machine.model.id}/bookings`)
                .send({
                  from: bookings[1].model.to,
                  to: bookings[2].model.from
                })
                .set('Accept', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(res => {
                  res.body.from.should.equal(bookings[1].model.to.toISOString())
                  res.body.to.should.equal(bookings[2].model.from.toISOString())
                }))))

      it('should fail on no such machine', () =>
        dbUtils.populateTokens(1)
          .then(({user, token}) =>
            request(app)
              .post('/api/machines/foo/bookings')
              .send({name: 'Machine 2000'})
              .set('Accept', 'application/json')
              .send({from: new Date(Date.now() + 60 * 60 * 1000), to: new Date(Date.now() + 2 * 60 * 60 * 1000)})
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should only fetch from own machine', () =>
        Promise.all([dbUtils.populateBookings(1), dbUtils.populateBookings(2)])
          .then(([{machine}, {user, token}]) => request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({from: new Date(Date.now() + 60 * 60 * 1000), to: new Date(Date.now() + 2 * 60 * 60 * 1000)})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect(404)
            .expect('Content-Type', /json/)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should succeed when user', () =>
        Promise
          .all([dbUtils.populateBookings(1), dbUtils.populateBookings(2)])
          .then(([{laundry, machine}, {user, token}]) =>
            laundry.addUser(user).then(() =>
              request(app)
                .post(`/api/machines/${machine.model.id}/bookings`)
                .send({from: new Date(Date.now() + 60 * 60 * 1000), to: new Date(Date.now() + 2 * 60 * 60 * 1000)})
                .auth(user.model.id, token.secret)
                .set('Accept', 'application/json')
                .expect(200)
                .expect('Content-Type', /json/)
                .then(res => {
                  const id = res.body.id
                  return BookingHandler.findFromId(id).then((machine) => {
                    machine.should.not.be.undefined
                    return machine.toRest().then((result) => res.body.should.deep.equal(result))
                  })
                }))))

      it('should succeed', () =>
        dbUtils.populateBookings(1).then(({user, token, machine, bookings}) =>
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({from: new Date(Date.now() + 60 * 60 * 1000), to: new Date(Date.now() + 2 * 60 * 60 * 1000)})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
              const id = res.body.id
              return BookingHandler.findFromId(id).then((machine) => {
                machine.should.not.be.undefined
                return machine.toRest().then((result) => res.body.should.deep.equal(result))
              })
            })))

      it('should fail on too soon booking', () =>
        dbUtils.populateMachines(1).then(({user, token, machine}) =>
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({from: new Date(Date.now()), to: new Date(Date.now() + 2 * 60 * 60 * 1000)})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .then(res => res.body.should.deep.equal({message: 'Too soon'}))))
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
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateBookings(1).then(({user, token}) =>
          request(app)
            .get('/api/bookings/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

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
              .then(res => res.body.should.deep.equal({message: 'Not found'}))))

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
              booking.toRest().then((result) => res.body.should.deep.equal(result)))))

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
                  .then(res => booking.toRest().then((result) => res.body.should.deep.equal(result))))))
    })

    describe('DELETE /bookings/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/api/bookings/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateBookings(1).then(({user, token}) =>
          request(app)
            .delete('/api/bookings/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateBookings(1).then(({user, token, bookings}) =>
          request(app)
            .delete('/api/bookings/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

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
              .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should succeed', () =>
        dbUtils.populateBookings(1).then(({user, token, booking}) =>
          request(app)
            .delete(`/api/bookings/${booking.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .then(res => BookingHandler
              .findFromId(booking.model.id)
              .then((t) => {
                assert(t === undefined)
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
                    .then(res => res.body.should.deep.equal({message: 'Not allowed'}))))))

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
  })
})
