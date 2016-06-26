const request = require('supertest')
const app = require('../../../app')
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()
const assert = chai.assert
const {MachineHandler} = require('../../../handlers')
const dbUtils = require('../../db_utils')
const lodash = require('lodash')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('machines', function () {
    this.timeout(5000)
    describe('GET /api/laundries/{id}/machines', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .get('/api/laundries/lid/machines')
          .set('Accept', 'application/json')
          .expect(403)
          .expect('Content-Type', /json/)
          .end((err, res) => done(err))
      })
      it('should limit output size', (done) => {
        dbUtils.populateMachines(50).then(({user, token, laundry, machines}) => {
          request(app)
            .get(`/api/laundries/${laundry.model.id}/machines`)
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .end(function (err, res) {
              if (err) return done(err)
              var arr = lodash.slice(machines.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)), 0, 10).map((machine) => machine.toRestSummary())
              res.body.should.deep.equal(arr)
              done()
            })
        })
      })
      it('fail on wrong laundry id', (done) => {
        dbUtils.populateMachines(50).then(({user, token, laundry, machines}) => {
          request(app)
            .get('/api/laundries/foo/machines')
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(404)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Laundry not found'})
              done()
            })
        })
      })
      it('should allow custom output size', (done) => {
        dbUtils.populateMachines(50).then(({user, token, machines, laundry}) => {
          request(app)
            .get(`/api/laundries/${laundry.model.id}/machines`)
            .query({page_size: 12})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .end(function (err, res) {
              if (err) return done(err)
              var arr = lodash.slice(machines.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)), 0, 12).map((laundry) => laundry.toRestSummary())
              res.body.should.deep.equal(arr)
              done()
            })
        })
      })

      it('should only fetch from current user', (done) => {
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([r1, r2]) => {
            const {user, token, machines, laundry} = r2
            request(app)
              .get(`/api/laundries/${laundry.model.id}/machines`)
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(200)
              .expect('Content-Type', /json/)
              .expect('Link', /rel=.first./)
              .end(function (err, res) {
                if (err) return done(err)
                var arr = machines.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map((machine) => machine.toRestSummary())
                res.body.should.deep.equal(arr)
                done()
              })
          })
      })

      it('should only fetch from own laundry', (done) => {
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([r1, r2]) => {
            const {laundry} = r1
            const {user, token} = r2
            request(app)
              .get(`/api/laundries/${laundry.model.id}/machines`)
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(404)
              .expect('Content-Type', /json/)
              .end(function (err, res) {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Laundry not found'})
                done()
              })
          })
      })
      it('should allow since', (done) => {
        dbUtils.populateMachines(50).then(({laundry, user, token, machines}) => {
          machines = machines.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id))
          request(app)
            .get(`/api/laundries/${laundry.model.id}/machines`)
            .query({since: machines[24].model.id, page_size: 1})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .end(function (err, res) {
              if (err) return done(err)
              res.body.should.deep.equal([machines[25].toRestSummary()])
              done()
            })
        })
      })
    })

    describe('POST /api/laundries/{lid}/machines', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .post('/api/laundries/lid1/machines')
          .send({name: 'Machine 1', type: 'wash'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })

      it('should fail on empty name', (done) => {
        dbUtils.populateMachines(1).then(({user, token, laundry, machines}) => {
          request(app)
            .post(`/api/laundries/${laundry.model.id}/machines`)
            .send({name: ' ', type: 'wash'})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
              done(err)
            })
        })
      })
      it('should fail on no such laundry', (done) => {
        dbUtils.populateMachines(1).then(({user, token}) => {
          request(app)
            .post('/api/laundries/foo/machines')
            .send({name: 'Machine 2000', type: 'wash'})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Laundry not found'})
              done()
            })
        })
      })

      it('should only fetch from own laundry', (done) => {
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([r1, r2]) => {
            const {laundry} = r1
            const {user, token} = r2
            request(app)
              .post(`/api/laundries/${laundry.model.id}/machines`)
              .send({name: 'Machine 2000', type: 'wash'})
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(404)
              .expect('Content-Type', /json/)
              .end(function (err, res) {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Laundry not found'})
                done()
              })
          })
      })
      it('should fail when not owner', (done) => {
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([r1, r2]) => {
            const {laundry} = r1
            const {user, token} = r2
            laundry._addUser(user).then(() => {
              request(app)
                .post(`/api/laundries/${laundry.model.id}/machines`)
                .send({name: 'Machine 2000', type: 'wash'})
                .auth(user.model.id, token.secret)
                .set('Accept', 'application/json')
                .expect(403)
                .expect('Content-Type', /json/)
                .end(function (err, res) {
                  if (err) return done(err)
                  res.body.should.deep.equal({message: 'Not allowed'})
                  done()
                })
            })
          })
      })
      it('should fail on duplicate name', (done) => {
        dbUtils.populateMachines(1).then(({user, token, laundry, machine}) => {
          request(app)
            .post(`/api/laundries/${laundry.model.id}/machines`)
            .send({name: machine.model.name, type: 'wash'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(409)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Machine already exists'})
              done()
            })
        })
      })
      it('should succeed on existing name in another laundry', (done) => {
        dbUtils.populateLaundries(2).then(({user, token, laundries: [l1, l2]}) => {
          return Promise.all([l1.createMachine('m1', 'wash'), l2.createMachine('m2', 'wash')])
            .then(([m1, m2]) => {
              request(app)
                .post(`/api/laundries/${l1.model.id}/machines`)
                .send({name: m2.model.name, type: 'wash'})
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                  done(err)
                })
            })
        }).catch(done)
      })

      it('should succeed', (done) => {
        dbUtils.populateMachines(1).then(({user, token, laundry, machines}) => {
          request(app)
            .post(`/api/laundries/${laundry.model.id}/machines`)
            .send({name: machines[0].model.name + ' 2', type: 'wash'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err)
              const id = res.body.id
              MachineHandler.findFromId(id).then((machine) => {
                machine.should.not.be.undefined
                return machine.toRest().then((result) => {
                  res.body.should.deep.equal(result)
                  done()
                })
              }).catch(done)
            })
        })
      })
    })
    describe('PUT /api/machines/{id}', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .put('/api/machines/machine1')
          .send({name: 'Machine 1', type: 'wash'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })

      it('should fail on empty name', (done) => {
        dbUtils.populateMachines(1).then(({user, token, machine}) => {
          request(app)
            .put(`/api/machines/${machine.model.id}`)
            .send({name: ' ', type: 'wash'})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
              done(err)
            })
        })
      })
      it('should fail on no such machine', (done) => {
        dbUtils.populateMachines(1).then(({user, token}) => {
          request(app)
            .put('/api/machines/foobar')
            .send({name: 'Machine 2000', type: 'wash'})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Machine not found'})
              done()
            })
        })
      })

      it('should only fetch from own machine', (done) => {
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([r1, r2]) => {
            const {machine} = r1
            const {user, token} = r2
            request(app)
              .put(`/api/machines/${machine.model.id}`)
              .send({name: 'Machine 2000', type: 'wash'})
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
      it('should fail when not owner', (done) => {
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([r1, r2]) => {
            const {machine, laundry} = r1
            const {user, token} = r2
            laundry._addUser(user).then(() => {
              request(app)
                .put(`/api/machines/${machine.model.id}`)
                .send({name: 'Machine 2000', type: 'wash'})
                .auth(user.model.id, token.secret)
                .set('Accept', 'application/json')
                .expect(403)
                .expect('Content-Type', /json/)
                .end(function (err, res) {
                  if (err) return done(err)
                  res.body.should.deep.equal({message: 'Not allowed'})
                  done()
                })
            })
          })
      })
      it('should succeed on same name', (done) => {
        dbUtils.populateMachines(1).then(({user, token, machine}) => {
          request(app)
            .put(`/api/machines/${machine.model.id}`)
            .send({name: machine.model.name, type: machine.model.type})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              done(err)
            })
        })
      })
      it('should fail on existing name', (done) => {
        dbUtils.populateMachines(2).then(({user, token, machines: [m1, m2]}) => {
          request(app)
            .put(`/api/machines/${m1.model.id}`)
            .send({name: m2.model.name, type: 'wash'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(409)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Machine already exists'})
              done()
            })
        })
      })
      it('should succeed on existing name in another laundry', (done) => {
        dbUtils.populateLaundries(2).then(({user, token, laundries: [l1, l2]}) => {
          return Promise.all([l1.createMachine('m1', 'wash'), l2.createMachine('m2', 'wash')])
            .then(([m1, m2]) => {
              request(app)
                .put(`/api/machines/${m1.model.id}`)
                .send({name: m2.model.name, type: 'wash'})
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                  done(err)
                })
            })
        }).catch(done)
      })
      it('should succeed', (done) => {
        dbUtils.populateMachines(1).then(({user, token, machine}) => {
          request(app)
            .put(`/api/machines/${machine.model.id}`)
            .send({name: machine.model.name + ' 2', type: 'dry'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err)
              MachineHandler.findFromId(machine.model.id).then((m) => {
                m.model.name.should.equal(machine.model.name + ' 2')
                m.model.type.should.equal('dry')
                return m.toRest().then((rest) => {
                  res.body.should.deep.equal(rest)
                  return done()
                })
              }).catch(done)
            })
        })
      })
    })

    describe('GET /machines/{id}', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .get('/api/machines/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should return 404 on invalid id', (done) => {
        dbUtils.populateMachines(1).then(({user, token}) => {
          request(app)
            .get('/api/machines/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Machine not found'})
              done()
            })
        })
      })
      it('should return 404 on missing id', (done) => {
        dbUtils.populateMachines(1).then(({user, token}) => {
          request(app)
            .get('/api/machines/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Machine not found'})
              done()
            })
        })
      })
      it('should return 404 on other id', (done) => {
        dbUtils.populateMachines(1).then(({machine}) => {
          dbUtils.populateMachines(1).then(({user, token}) => {
            request(app)
              .get(`/api/machines/${machine.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .end((err, res) => {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Machine not found'})
                done()
              })
          })
        })
      })
      it('should succeed', (done) => {
        dbUtils.populateMachines(1).then(({user, token, machines}) => {
          request(app)
            .get(`/api/machines/${machines[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err)
              machines[0].toRest().then((result) => {
                res.body.should.deep.equal(result)
                done()
              })
            })
        })
      })
      it('should succeed when only user', (done) => {
        dbUtils.populateTokens(1).then(({user, tokens}) => {
          const [token] = tokens
          return dbUtils.populateMachines(1).then(({machine, laundry}) => {
            return user.addLaundry(laundry)
              .then(() => {
                request(app)
                  .get(`/api/machines/${machine.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect('Content-Type', /json/)
                  .expect(200)
                  .end((err, res) => {
                    if (err) return done(err)
                    machine.toRest().then((result) => {
                      res.body.should.deep.equal(result)
                      done()
                    }).catch(done)
                  })
              })
          })
        })
      })
    })
    describe('DELETE /machines/{id}', () => {
      it('should fail on not authenticated', (done) => {
        request(app)
          .delete('/api/machines/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => done(err))
      })
      it('should return 404 on invalid id', (done) => {
        dbUtils.populateMachines(1).then(({user, token, machines}) => {
          request(app)
            .delete('/api/machines/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Machine not found'})
              done()
            })
        })
      })
      it('should return 404 on missing id', (done) => {
        dbUtils.populateMachines(1).then(({user, token, machines}) => {
          request(app)
            .delete('/api/machines/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .end((err, res) => {
              if (err) return done(err)
              res.body.should.deep.equal({message: 'Machine not found'})
              done()
            })
        })
      })
      it('should return 404 on other id', (done) => {
        dbUtils.populateMachines(1).then(({machine}) => {
          dbUtils.populateMachines(1).then(({user, token}) => {
            request(app)
              .delete(`/api/machines/${machine.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .end((err, res) => {
                if (err) return done(err)
                res.body.should.deep.equal({message: 'Machine not found'})
                done()
              })
          })
        })
      })
      it('should succeed', (done) => {
        dbUtils.populateMachines(1).then(({user, token, machine}) => {
          request(app)
            .delete(`/api/machines/${machine.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .end((err, res) => {
              if (err) return done(err)
              MachineHandler
                .findFromId(machine.model.id)
                .then((t) => {
                  assert(t === undefined)
                  done()
                })
            })
        })
        it('should fail when only user', (done) => {
          dbUtils.populateTokens(1).then(({user, tokens}) => {
            const [token] = tokens
            return dbUtils.populateMachines(1).then(({machine, laundry}) => {
              return user.addLaundry(laundry)
                .then(() => {
                  request(app)
                    .delete(`/api/machines/${machine.model.id}`)
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
          })
        })
      })
    })
  })
})
