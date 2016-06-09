const request = require('supertest')
const app = require('../../../app')
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()
const assert = chai.assert
const {BookingHandler} = require('../../../handlers')
const dbUtils = require('../../db_utils')
const lodash = require('lodash')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('bookings', function () {
    this.timeout(5000)
    describe('GET /api/bookings/{id}/bookings', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .get('/api/machines/lid/bookings')
          .set('Accept', 'application/json')
          .expect(403)
          .expect('Content-Type', /json/)
          .end((err, res) => done(err))
      })
      it('should limit output size', (done) => {
        dbUtils.populateBookings(50).then(({user, token, laundry, bookings}) => {
          request(app)
            .get(`/api/machines/${laundry.model.id}/bookings`)
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .end(function (err, res) {
              if (err) return done(err)
              var arr = lodash.slice(bookings.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)), 0, 10).map((machine) => machine.toRestSummary())
              res.body.should.deep.equal(arr)
              done()
            })
        }).catch(done)
      })
      it('fail on wrong machine id', (done) => {
        dbUtils.populateBookings(50).then(({user, token}) => {
          request(app)
            .get('/api/machines/foo/bookings')
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(404)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Machine not found'})
              done()
            })
        }).catch(done)
      })
      it('should allow custom output size', (done) => {
        dbUtils.populateBookings(50).then(({user, token, bookings, machine}) => {
          request(app)
            .get(`/api/machines/${machine.model.id}/bookings`)
            .query({page_size: 12})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .end(function (err, res) {
              if (err) return done(err)
              var arr = lodash.slice(bookings.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)), 0, 12).map((booking) => booking.toRestSummary())
              res.body.should.deep.equal(arr)
              done()
            })
        }).catch(done)
      })

      it('should only fetch from current machine', (done) => {
        Promise.all([dbUtils.populateBookings(1), dbUtils.populateBookings(2)])
          .then(([r1, r2]) => {
            const {user, token, bookings, machine} = r2
            request(app)
              .get(`/api/machines/${machine.model.id}/bookings`)
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(200)
              .expect('Content-Type', /json/)
              .expect('Link', /rel=.first./)
              .end(function (err, res) {
                if (err) return done(err)
                var arr = bookings.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map((machine) => machine.toRestSummary())
                res.body.should.deep.equal(arr)
                done()
              })
          }).catch(done)
      })

      it('should only fetch from own machine', (done) => {
        Promise.all([dbUtils.populateBookings(1), dbUtils.populateBookings(2)])
          .then(([r1, r2]) => {
            const {machine} = r1
            const {user, token} = r2
            request(app)
              .get(`/api/machines/${machine.model.id}/bookings`)
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(404)
              .expect('Content-Type', /json/)
              .end(function (err, res) {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Laundry not found'})
                done()
              })
          }).catch(done)
      })
      it('should allow since', (done) => { // TODO no
        dbUtils.populateBookings(50).then(({machine, user, token, bookings}) => {
          bookings = bookings.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id))
          request(app)
            .get(`/api/machines/${machine.model.id}/bookings`)
            .query({since: bookings[24].model.id, page_size: 1})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .end(function (err, res) {
              if (err) return done(err)
              res.body.should.deep.equal([bookings[25].toRestSummary()])
              done()
            })
        }).catch(done)
      })
    })

    describe('POST /api/machines/{lid}/bookings', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .post('/api/machines/lid1/bookings')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })

      it('should fail on invalid from', (done) => {
        dbUtils.populateBookings(1).then(({user, token, machine, bookings}) => {
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({from: 'invalid date', to: new Date()})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
              done(err)
            })
        })
      })
      it('should fail on invalid to', (done) => {
        dbUtils.populateBookings(1).then(({user, token, machine, bookings}) => {
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({to: 'invalid date', from: new Date()})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
              done(err)
            })
        }).catch(done)
      })
      it('should fail from after to', (done) => {
        dbUtils.populateBookings(1).then(({user, token, machine, bookings}) => {
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({to: new Date(0), from: new Date()})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'From must be before to'})
              done()
            })
        }).catch(done)
      })
      it('should fail from on to', (done) => {
        dbUtils.populateBookings(1).then(({user, token, machine, bookings}) => {
          const date = new Date()
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({to: date, from: date})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'From must be before to'})
              done()
            })
        }).catch(done)
      })
      it('should on double booking', (done) => {
        dbUtils.populateBookings(3).then(({user, token, machine, booking}) => {
          request(app)
            .post(`/api/machines/${machine.model.id}/bookings`)
            .send({to: new Date(booking.getTime() + 2), from: new Date(0)})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Machine not available'})
              done()
            })
        }).catch(done)
      })

      it('should fail on no such machine', (done) => {
        dbUtils.populateBookings(1).then(({user, token}) => {
          request(app)
            .post('/api/machines/foo/bookings')
            .send({name: 'Machine 2000'})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Machine not found'})
              done()
            })
        }).catch(done)
      })

      it('should only fetch from own machine', (done) => {
        Promise.all([dbUtils.populateBookings(1), dbUtils.populateBookings(2)])
          .then(([r1, r2]) => {
            const {machine} = r1
            const {user, token} = r2
            request(app)
              .post(`/api/machines/${machine.model.id}/bookings`)
              .send({from: new Date(), to: new Date(Date.now() + 5)})
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(404)
              .expect('Content-Type', /json/)
              .end(function (err, res) {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Machine not found'})
                done()
              })
          })
      })
      it('should succede when user', (done) => { // TODO fix
        Promise.all([dbUtils.populateBookings(1), dbUtils.populateBookings(2)])
          .then(([r1, r2]) => {
            const {laundry, machine} = r1
            const {user, token} = r2
            laundry._addUser(user).then(() => {
              request(app)
                .post(`/api/machines/${machine.model.id}/bookings`)
                .send({from: new Date(), to: new Date(Date.now() + 5)})
                .auth(user.model.id, token.secret)
                .set('Accept', 'application/json')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function (err, res) {
                  if (err) return done(err)
                  done()
                })
            })
          }).catch(done)
      })

      it('should succeed', (done) => {
        dbUtils.populateBookings(1).then(({user, token, laundry, bookings}) => {
          request(app)
            .post(`/api/machines/${laundry.model.id}/bookings`)
            .send({from: new Date(), to: new Date(Date.now() + 5)})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err)
              const id = res.body.id
              BookingHandler.findFromId(id).then((machine) => {
                machine.should.not.be.undefined
                return machine.toRest().then((result) => {
                  res.body.should.deep.equal(result)
                  done()
                })
              }).catch(done)
            })
        }).catch(done)
      })
    })

    describe('GET /bookings/{id}', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .get('/api/bookings/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should return 404 on invalid id', (done) => {
        dbUtils.populateBookings(1).then(({user, token}) => {
          request(app)
            .get('/api/bookings/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Booking not found'})
              done()
            })
        }).catch(done)
      })
      it('should return 404 on missing id', (done) => {
        dbUtils.populateBookings(1).then(({user, token}) => {
          request(app)
            .get('/api/bookings/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Booking not found'})
              done()
            })
        }).catch(done)
      })
      it('should return 404 on other id', (done) => {
        dbUtils.populateBookings(1).then(({machine}) => {
          dbUtils.populateBookings(1).then(({user, token}) => {
            request(app)
              .get(`/api/bookings/${machine.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .end((err, res) => {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Booking not found'})
                done()
              })
          }).catch(done)
        }).catch(done)
      })
      it('should succeed', (done) => {
        dbUtils.populateBookings(1).then(({user, token, booking}) => {
          request(app)
            .get(`/api/bookings/${booking.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err)
              booking.toRest().then((result) => {
                res.body.should.deep.equal(result)
                done()
              })
            })
        }).catch(done)
      })
      it('should succeed when only user', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          const [token] = tokens
          return dbUtils.populateBookings(1).then(({booking, laundry}) => {
            return user.addLaundry(laundry)
              .then(() => {
                request(app)
                  .get(`/api/bookings/${booking.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect('Content-Type', /json/)
                  .expect(200)
                  .end((err, res) => {
                    if (err) return done(err)
                    booking.toRest().then((result) => {
                      res.body.should.deep.equal(result)
                      done()
                    }).catch(done)
                  })
              })
          })
        }).catch(done)
      })
    })
    describe('DELETE /bookings/{id}', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .delete('/api/bookings/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should return 404 on invalid id', (done) => {
        dbUtils.populateBookings(1).then(({user, token}) => {
          request(app)
            .delete('/api/bookings/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Booking not found'})
              done()
            })
        })
      })
      it('should return 404 on missing id', (done) => {
        dbUtils.populateBookings(1).then(({user, token, bookings}) => {
          request(app)
            .delete('/api/bookings/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Booking not found'})
              done()
            })
        }).catch(done)
      })
      it('should return 404 on other id', (done) => {
        dbUtils.populateBookings(1).then(({booking}) => {
          dbUtils.populateBookings(1).then(({user, token}) => {
            request(app)
              .delete(`/api/bookings/${booking.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .end((err, res) => {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Booking not found'})
                done()
              })
          }).catch(done)
        }).catch(done)
      })
      it('should succeed', (done) => {
        dbUtils.populateBookings(1).then(({user, token, machine}) => {
          request(app)
            .delete(`/api/bookings/${machine.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .end((err, res) => {
              if (err) return done(err)
              BookingHandler
                .findFromId(machine.model.id)
                .then((t) => {
                  assert(t === undefined)
                  done()
                })
            })
        }).catch(done)
      })

      it('should fail when other user', (done) => {
        dbUtils.populateTokens(1).then(({user, token}) => {
          return dbUtils.populateBookings(1).then(({booking, laundry}) => {
            return user.addLaundry(laundry)
              .then(() => {
                request(app)
                  .delete(`/api/bookings/${booking.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect('Content-Type', /json/)
                  .expect(403)
                  .end((err, res) => {
                    if (err) return done(err)
                    res.body.should.deep.equal({message: 'Not allowed'})
                  })
              })
          })
        }).catch(done)
      })
      it('should fail when laundry owner', (done) => {
        dbUtils.populateMachines(1).then(({user, token, laundry, machine}) => {
          return dbUtils.populateUsers(1).then((minion) =>
            laundry._addUser(minion).then(() => machine.createBooking(minion, new Date(), new Date(Date.now() + 300))))
            .then(() => {
              request(app)
                .delete(`/api/bookings/${machine.model.id}`)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(204)
                .end((err, res) => {
                  done(err)
                })
            })
        })
      })
    })
  })
})
