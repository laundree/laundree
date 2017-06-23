import request from 'supertest'
import {app} from '../../../../test_target/app'
import chai from 'chai'
import MachineHandler from '../../../../test_target/handlers/machine'
import dbUtils from '../../../db_utils'

chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()
const assert = chai.assert

describe('controllers', function () {
  this.timeout(10000)
  let admin, admintoken
  beforeEach(() => dbUtils.clearDb().then(() => dbUtils.createAdministrator()).then(({user, token}) => {
    admin = user
    admintoken = token
  }))
  describe('machines', function () {
    describe('GET /api/laundries/{id}/machines', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .get('/api/laundries/lid/machines')
          .set('Accept', 'application/json')
          .expect(403)
          .expect('Content-Type', /json/))

      it('should limit output size', () =>
        dbUtils.populateMachines(50).then(({user, token, laundry, machines}) =>
          request(app)
            .get(`/api/laundries/${laundry.model.id}/machines`)
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .then(res => {
              const arr = machines.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)).slice(0, 10).map((machine) => machine.toRestSummary())
              res.body.should.deep.equal(arr)
            })))

      it('fail on wrong laundry id', () =>
        dbUtils.populateMachines(50).then(({user, token, machines}) =>
          request(app)
            .get('/api/laundries/foo/machines')
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(404)
            .expect('Content-Type', /json/)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should allow custom output size', () =>
        dbUtils.populateMachines(50).then(({user, token, machines, laundry}) =>
          request(app)
            .get(`/api/laundries/${laundry.model.id}/machines`)
            .query({page_size: 12})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .then(res => {
              const arr = machines.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).slice(0, 12).map((laundry) => laundry.toRestSummary())
              res.body.should.deep.equal(arr)
            })))

      it('should only fetch from current user', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([r1, {user, token, machines, laundry}]) =>
            request(app)
              .get(`/api/laundries/${laundry.model.id}/machines`)
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(200)
              .expect('Content-Type', /json/)
              .expect('Link', /rel=.first./)
              .then(res => {
                const arr = machines.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map((machine) => machine.toRestSummary())
                res.body.should.deep.equal(arr)
              })))

      it('should only fetch from current user when admin', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([r1, {machines, laundry}]) =>
            request(app)
              .get(`/api/laundries/${laundry.model.id}/machines`)
              .auth(admin.model.id, admintoken.secret)
              .set('Accept', 'application/json')
              .expect(200)
              .expect('Content-Type', /json/)
              .expect('Link', /rel=.first./)
              .then(res => {
                const arr = machines.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map((machine) => machine.toRestSummary())
                res.body.should.deep.equal(arr)
              })))

      it('should only fetch from own laundry', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([{laundry}, {user, token}]) =>
            request(app)
              .get(`/api/laundries/${laundry.model.id}/machines`)
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(404)
              .expect('Content-Type', /json/)
              .then(res => {
                res.body.should.deep.equal({message: 'Not found'})
              })))

      it('should allow since', () =>
        dbUtils.populateMachines(50).then(({laundry, user, token, machines}) => {
          machines = machines.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id))
          return request(app)
            .get(`/api/laundries/${laundry.model.id}/machines`)
            .query({since: machines[24].model.id, page_size: 1})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .then(res => {
              res.body.should.deep.equal([machines[25].toRestSummary()])
            })
        }))
    })

    describe('POST /api/laundries/{lid}/machines', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .post('/api/laundries/lid1/machines')
          .send({name: 'Machine 1', type: 'wash'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should fail on empty name', () =>
        dbUtils.populateMachines(1).then(({user, token, laundry, machines}) =>
          request(app)
            .post(`/api/laundries/${laundry.model.id}/machines`)
            .send({name: ' ', type: 'wash', broken: false})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)))

      it('should fail on no such laundry', () =>
        dbUtils.populateMachines(1).then(({user, token}) =>
          request(app)
            .post('/api/laundries/foo/machines')
            .send({name: 'Machine 2000', type: 'wash'})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => {
              res.body.should.deep.equal({message: 'Not found'})
            })))

      it('should only fetch from own laundry', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([{laundry}, {user, token}]) =>
            request(app)
              .post(`/api/laundries/${laundry.model.id}/machines`)
              .send({name: 'Machine 2000', type: 'wash'})
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(404)
              .expect('Content-Type', /json/)
              .then(res => {
                res.body.should.deep.equal({message: 'Not found'})
              })))

      it('should fail when not owner', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([{laundry}, {user, token}]) =>
            laundry.addUser(user).then(() =>
              request(app)
                .post(`/api/laundries/${laundry.model.id}/machines`)
                .send({name: 'Machine 2000', type: 'wash'})
                .auth(user.model.id, token.secret)
                .set('Accept', 'application/json')
                .expect(403)
                .expect('Content-Type', /json/)
                .then(res => {
                  res.body.should.deep.equal({message: 'Not allowed'})
                }))))

      it('should fail on duplicate name', () =>
        dbUtils.populateMachines(1).then(({user, token, laundry, machine}) =>
          request(app)
            .post(`/api/laundries/${laundry.model.id}/machines`)
            .send({name: machine.model.name, type: 'wash', broken: false})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(409)
            .then(res => {
              res.body.should.deep.equal({message: 'Machine already exists'})
            })))

      it('should succeed on existing name in another laundry', () =>
        dbUtils.populateLaundries(2).then(({user, token, laundries: [l1, l2]}) =>
          Promise.all([l1.createMachine('m1', 'wash'), l2.createMachine('m2', 'wash')])
            .then(([m1, m2]) =>
              request(app)
                .post(`/api/laundries/${l1.model.id}/machines`)
                .send({name: m2.model.name, type: 'wash', broken: false})
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(200))))

      it('should succeed', () =>
        dbUtils.populateMachines(1).then(({user, token, laundry, machines}) =>
          request(app)
            .post(`/api/laundries/${laundry.model.id}/machines`)
            .send({name: machines[0].model.name + ' 2', type: 'wash', broken: false})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
              const id = res.body.id
              return MachineHandler.lib.findFromId(id).then((machine) => {
                machine.should.not.be.undefined
                return machine.toRest().then((result) => res.body.should.deep.equal(result))
              })
            })))

      it('should succeed when admin', () =>
        dbUtils.populateMachines(1).then(({laundry, machines}) =>
          request(app)
            .post(`/api/laundries/${laundry.model.id}/machines`)
            .send({name: machines[0].model.name + ' 2', type: 'wash', broken: false})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(admin.model.id, admintoken.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
              const id = res.body.id
              return MachineHandler.lib.findFromId(id).then((machine) => {
                machine.should.not.be.undefined
                return machine.toRest().then((result) => res.body.should.deep.equal(result))
              })
            })))
    })
    describe('PUT /api/machines/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .put('/api/machines/machine1')
          .send({name: 'Machine 1', type: 'wash'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should fail on empty name', () =>
        dbUtils.populateMachines(1).then(({user, token, machine}) =>
          request(app)
            .put(`/api/machines/${machine.model.id}`)
            .send({name: ' ', type: 'wash'})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)))

      it('should fail on no such machine', () =>
        dbUtils.populateMachines(1).then(({user, token}) =>
          request(app)
            .put('/api/machines/foobar')
            .send({name: 'Machine 2000', type: 'wash'})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should only fetch from own machine', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([{machine}, {user, token}]) =>
            request(app)
              .put(`/api/machines/${machine.model.id}`)
              .send({name: 'Machine 2000', type: 'wash'})
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(404)
              .expect('Content-Type', /json/)
              .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should fail when not owner', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([{machine, laundry}, {user, token}]) =>
            laundry.addUser(user).then(() =>
              request(app)
                .put(`/api/machines/${machine.model.id}`)
                .send({name: 'Machine 2000', type: 'wash'})
                .auth(user.model.id, token.secret)
                .set('Accept', 'application/json')
                .expect(403)
                .expect('Content-Type', /json/)
                .then(res => res.body.should.deep.equal({message: 'Not allowed'})))))

      it('should succeed on same name', () =>
        dbUtils.populateMachines(1).then(({user, token, machine}) =>
          request(app)
            .put(`/api/machines/${machine.model.id}`)
            .send({name: machine.model.name, type: machine.model.type})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)))

      it('should fail on existing name', () =>
        dbUtils.populateMachines(2).then(({user, token, machines: [m1, m2]}) =>
          request(app)
            .put(`/api/machines/${m1.model.id}`)
            .send({name: m2.model.name, type: 'wash'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(409)
            .then(res => res.body.should.deep.equal({message: 'Machine already exists'}))))

      it('should succeed on existing name in another laundry', () =>
        dbUtils.populateLaundries(2).then(({user, token, laundries: [l1, l2]}) =>
          Promise.all([l1.createMachine('m1', 'wash'), l2.createMachine('m2', 'wash')])
            .then(([m1, m2]) =>
              request(app)
                .put(`/api/machines/${m1.model.id}`)
                .send({name: m2.model.name, type: 'wash'})
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(200))))

      it('should succeed', () =>
        dbUtils.populateMachines(1).then(({user, token, machine}) =>
          request(app)
            .put(`/api/machines/${machine.model.id}`)
            .send({name: machine.model.name + ' 2', type: 'dry'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => MachineHandler.lib.findFromId(machine.model.id).then((m) => {
              m.model.name.should.equal(machine.model.name + ' 2')
              m.model.type.should.equal('dry')
              return m.toRest().then((rest) => {
                res.body.should.deep.equal(rest)
              })
            }))))
      it('should succeed when admin', () =>
        dbUtils.populateMachines(1).then(({machine}) =>
          request(app)
            .put(`/api/machines/${machine.model.id}`)
            .send({name: machine.model.name + ' 2', type: 'dry'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(admin.model.id, admintoken.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => MachineHandler.lib.findFromId(machine.model.id).then((m) => {
              m.model.name.should.equal(machine.model.name + ' 2')
              m.model.type.should.equal('dry')
              return m.toRest().then((rest) => {
                res.body.should.deep.equal(rest)
              })
            }))))
    })

    describe('GET /machines/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .get('/api/machines/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateMachines(1).then(({user, token}) =>
          request(app)
            .get('/api/machines/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateMachines(1).then(({user, token}) =>
          request(app)
            .get('/api/machines/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on other id', () =>
        dbUtils.populateMachines(1).then(({machine}) =>
          dbUtils.populateMachines(1).then(({user, token}) =>
            request(app)
              .get(`/api/machines/${machine.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .then(res => res.body.should.deep.equal({message: 'Not found'})))))

      it('should succeed', () =>
        dbUtils.populateMachines(1).then(({user, token, machines}) =>
          request(app)
            .get(`/api/machines/${machines[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => machines[0].toRest().then((result) => res.body.should.deep.equal(result)))))

      it('should succeed when admin', () =>
        dbUtils.populateMachines(1).then(({machines}) =>
          request(app)
            .get(`/api/machines/${machines[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(admin.model.id, admintoken.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => machines[0].toRest().then((result) => res.body.should.deep.equal(result)))))

      it('should succeed when only user', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          dbUtils.populateMachines(1).then(({machine, laundry}) =>
            laundry.addUser(user)
              .then(() =>
                request(app)
                  .get(`/api/machines/${machine.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect('Content-Type', /json/)
                  .expect(200)
                  .then(res =>
                    machine.toRest().then((result) => res.body.should.deep.equal(result)))))))
    })
    describe('DELETE /machines/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/api/machines/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403))

      it('should return 404 on invalid id', () =>
        dbUtils.populateMachines(1).then(({user, token}) =>
          request(app)
            .delete('/api/machines/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateMachines(1).then(({user, token}) =>
          request(app)
            .delete('/api/machines/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => res.body.should.deep.equal({message: 'Not found'}))))

      it('should return 404 on other id', () =>
        dbUtils.populateMachines(1).then(({machine}) =>
          dbUtils.populateMachines(1).then(({user, token}) =>
            request(app)
              .delete(`/api/machines/${machine.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(404)
              .then(res => res.body.should.deep.equal({message: 'Not found'})))))

      it('should succeed', () =>
        dbUtils.populateMachines(1).then(({user, token, machine}) =>
          request(app)
            .delete(`/api/machines/${machine.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .then(res => MachineHandler
              .lib.findFromId(machine.model.id)
              .then((t) => assert(!t)))))

      it('should succeed when admin', () =>
        dbUtils.populateMachines(1).then(({machine}) =>
          request(app)
            .delete(`/api/machines/${machine.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(admin.model.id, admintoken.secret)
            .expect(204)
            .then(res => MachineHandler
              .lib.findFromId(machine.model.id)
              .then((t) => assert(!t)))))

      it('should fail when only user', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          dbUtils.populateMachines(1).then(({machine, laundry}) =>
            laundry.addUser(user)
              .then(() =>
                request(app)
                  .delete(`/api/machines/${machine.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect('Content-Type', /json/)
                  .expect(403)
                  .then(res => res.body.should.deep.equal({message: 'Not allowed'}))))))
    })
  })
})
