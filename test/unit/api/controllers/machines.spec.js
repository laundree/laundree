// @flow

import request from 'supertest'
import promisedApp from '../../../../test_target/api/app'
import MachineHandler from '../../../../test_target/handlers/machine'
import * as dbUtils from '../../../db_utils'
import assert from 'assert'

describe('controllers', function () {
  this.timeout(10000)
  let admin, admintoken, app

  beforeEach(async () => {
    await dbUtils.clearDb()
    const {user, token} = await dbUtils.createAdministrator()
    app = await promisedApp
    admin = user
    admintoken = token
  })

  describe('machines', function () {
    describe('GET /laundries/{id}/machines', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .get('/laundries/lid/machines')
          .set('Accept', 'application/json')
          .expect(401)
          .expect('Content-Type', /json/))

      it('should limit output size', () =>
        dbUtils.populateMachines(50).then(({user, token, laundry, machines}) =>
          request(app)
            .get(`/laundries/${laundry.model.id}/machines`)
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .then(res => {
              const arr = machines.sort((l1, l2) => l1.model.id.localeCompare(l2.model.id)).slice(0, 10).map(MachineHandler.restSummary)
              assert.deepEqual(res.body, arr)
            })))

      it('fail on wrong laundry id', () =>
        dbUtils.populateMachines(50).then(({user, token, machines}) =>
          request(app)
            .get('/laundries/foo/machines')
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(404)
            .expect('Content-Type', /json/)
            .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should allow custom output size', () =>
        dbUtils.populateMachines(50).then(({user, token, machines, laundry}) =>
          request(app)
            .get(`/laundries/${laundry.model.id}/machines`)
            .query({page_size: 12})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .then(res => {
              const arr = machines.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).slice(0, 12).map(MachineHandler.restSummary)
              assert.deepEqual(res.body, arr)
            })))

      it('should only fetch from current user', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([r1, {user, token, machines, laundry}]) =>
            request(app)
              .get(`/laundries/${laundry.model.id}/machines`)
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(200)
              .expect('Content-Type', /json/)
              .expect('Link', /rel=.first./)
              .then(res => {
                const arr = machines.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map(MachineHandler.restSummary)
                assert.deepEqual(res.body, arr)
              })))

      it('should only fetch from current user when admin', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([r1, {machines, laundry}]) =>
            request(app)
              .get(`/laundries/${laundry.model.id}/machines`)
              .auth(admin.model.id, admintoken.secret)
              .set('Accept', 'application/json')
              .expect(200)
              .expect('Content-Type', /json/)
              .expect('Link', /rel=.first./)
              .then(res => {
                const arr = machines.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id)).map(MachineHandler.restSummary)
                assert.deepEqual(res.body, arr)
              })))

      it('should only fetch from own laundry', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([{laundry}, {user, token}]) =>
            request(app)
              .get(`/laundries/${laundry.model.id}/machines`)
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(403)
              .expect('Content-Type', /json/)
              .then(res => {
                assert.deepEqual(res.body, {message: 'Not allowed'})
              })))

      it('should allow since', () =>
        dbUtils.populateMachines(50).then(({laundry, user, token, machines}) => {
          machines = machines.sort((t1, t2) => t1.model.id.localeCompare(t2.model.id))
          return request(app)
            .get(`/laundries/${laundry.model.id}/machines`)
            .query({since: machines[24].model.id, page_size: 1})
            .auth(user.model.id, token.secret)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .then(res => {
              assert.deepEqual(res.body, [MachineHandler.restSummary(machines[25])])
            })
        }))
    })

    describe('POST /laundries/{lid}/machines', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .post('/laundries/lid1/machines')
          .send({name: 'Machine 1', type: 'wash'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should fail on empty name', () =>
        dbUtils.populateMachines(1).then(({user, token, laundry, machines}) =>
          request(app)
            .post(
              `/laundries/${laundry.model.id}/machines`)
            .send({name: ' ', type: 'wash', broken: false})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)))

      it('should fail on no such laundry', () =>
        dbUtils.populateMachines(1).then(({user, token}) =>
          request(app)
            .post('/laundries/foo/machines')
            .send({name: 'Machine 2000', type: 'wash', broken: false})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => {
              assert.deepEqual(res.body, {message: 'Not found'})
            })))

      it('should only fetch from own laundry', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([{laundry}, {user, token}]) =>
            request(app)
              .post(`/laundries/${laundry.model.id}/machines`)
              .send({name: 'Machine 2000', type: 'wash', broken: false})
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(403)
              .expect('Content-Type', /json/)
              .then(res => {
                assert.deepEqual(res.body, {message: 'Not allowed'})
              })))

      it('should fail when not owner', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([{laundry}, {user, token}]) =>
            laundry.addUser(user).then(() =>
              request(app)
                .post(`/laundries/${laundry.model.id}/machines`)
                .send({name: 'Machine 2000', type: 'wash', broken: false})
                .auth(user.model.id, token.secret)
                .set('Accept', 'application/json')
                .expect(403)
                .expect('Content-Type', /json/)
                .then(res => {
                  assert.deepEqual(res.body, {message: 'Not allowed'})
                }))))

      it('should fail on duplicate name', () =>
        dbUtils.populateMachines(1).then(({user, token, laundry, machine}) =>
          request(app)
            .post(`/laundries/${laundry.model.id}/machines`)
            .send({name: machine.model.name, type: 'wash', broken: false})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(409)
            .then(res => {
              assert.deepEqual(res.body, {message: 'Machine already exists'})
            })))

      it('should succeed on existing name in another laundry', () =>
        dbUtils.populateLaundries(2).then(({user, token, laundries: [l1, l2]}) =>
          Promise.all([l1.createMachine('m1', 'wash'), l2.createMachine('m2', 'wash')])
            .then(([m1, m2]) =>
              request(app)
                .post(`/laundries/${l1.model.id}/machines`)
                .send({name: m2.model.name, type: 'wash', broken: false})
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(200))))

      it('should succeed', () =>
        dbUtils.populateMachines(1).then(({user, token, laundry, machines}) =>
          request(app)
            .post(`/laundries/${laundry.model.id}/machines`)
            .send({name: machines[0].model.name + ' 2', type: 'wash', broken: false})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
              const id = res.body.id
              return MachineHandler.lib.findFromId(id).then(async (machine) => {
                assert(machine)
                const result = await machine.toRest()
                assert.deepEqual(res.body, result)
              })
            })))

      it('should succeed when admin', () =>
        dbUtils.populateMachines(1).then(({laundry, machines}) =>
          request(app)
            .post(`/laundries/${laundry.model.id}/machines`)
            .send({name: machines[0].model.name + ' 2', type: 'wash', broken: false})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(admin.model.id, admintoken.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
              const id = res.body.id
              return MachineHandler.lib.findFromId(id).then(async (machine) => {
                assert(machine)
                const result = await machine.toRest()
                assert.deepEqual(res.body, result)
              })
            })))
    })

    describe('PUT /machines/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .put('/machines/machine1')
          .send({name: 'Machine 1', type: 'wash'})
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should fail on empty name', () =>
        dbUtils.populateMachines(1).then(({user, token, machine}) =>
          request(app)
            .put(`/machines/${machine.model.id}`)
            .send({name: ' ', type: 'wash'})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(400)))

      it('should fail on no such machine', () =>
        dbUtils.populateMachines(1).then(({user, token}) =>
          request(app)
            .put('/machines/foobar')
            .send({name: 'Machine 2000', type: 'wash'})
            .set('Accept', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should only fetch from own machine', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([{machine}, {user, token}]) =>
            request(app)
              .put(`/machines/${machine.model.id}`)
              .send({name: 'Machine 2000', type: 'wash'})
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect(403)
              .expect('Content-Type', /json/)
              .then(res => assert.deepEqual(res.body, {message: 'Not allowed'}))))

      it('should fail when not owner', () =>
        Promise.all([dbUtils.populateMachines(1), dbUtils.populateMachines(2)])
          .then(([{machine, laundry}, {user, token}]) =>
            laundry.addUser(user).then(() =>
              request(app)
                .put(`/machines/${machine.model.id}`)
                .send({name: 'Machine 2000', type: 'wash'})
                .auth(user.model.id, token.secret)
                .set('Accept', 'application/json')
                .expect(403)
                .expect('Content-Type', /json/)
                .then(res => assert.deepEqual(res.body, {message: 'Not allowed'})))))

      it('should succeed on same name', () =>
        dbUtils.populateMachines(1).then(({user, token, machine}) =>
          request(app)
            .put(`/machines/${machine.model.id}`)
            .send({name: machine.model.name, type: machine.model.type})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)))

      it('should fail on existing name', () =>
        dbUtils.populateMachines(2).then(({user, token, machines: [m1, m2]}) =>
          request(app)
            .put(`/machines/${m1.model.id}`)
            .send({name: m2.model.name, type: 'wash'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(409)
            .then(res => assert.deepEqual(res.body, {message: 'Machine already exists'}))))

      it('should succeed on existing name in another laundry', () =>
        dbUtils.populateLaundries(2).then(({user, token, laundries: [l1, l2]}) =>
          Promise.all([l1.createMachine('m1', 'wash'), l2.createMachine('m2', 'wash')])
            .then(([m1, m2]) =>
              request(app)
                .put(`/machines/${m1.model.id}`)
                .send({name: m2.model.name, type: 'wash'})
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .auth(user.model.id, token.secret)
                .expect('Content-Type', /json/)
                .expect(200))))

      it('should succeed', () =>
        dbUtils.populateMachines(1).then(({user, token, machine}) =>
          request(app)
            .put(`/machines/${machine.model.id}`)
            .send({name: machine.model.name + ' 2', type: 'dry'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => MachineHandler.lib.findFromId(machine.model.id).then((m) => {
              assert.equal(m.model.name, machine.model.name + ' 2')
              assert.equal(m.model.type, 'dry')
              const rest = m.toRest()
              assert.deepEqual(res.body, rest)
            }))))
      it('should succeed when admin', () =>
        dbUtils.populateMachines(1).then(({machine}) =>
          request(app)
            .put(`/machines/${machine.model.id}`)
            .send({name: machine.model.name + ' 2', type: 'dry'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(admin.model.id, admintoken.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => MachineHandler.lib.findFromId(machine.model.id).then((m) => {
              assert.equal(m.model.name, machine.model.name + ' 2')
              assert.equal(m.model.type, 'dry')
              const rest = m.toRest()
              assert.deepEqual(res.body, rest)
            }))))
    })

    describe('GET /machines/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .get('/machines/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return 404 on invalid id', () =>
        dbUtils.populateMachines(1).then(({user, token}) =>
          request(app)
            .get('/machines/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateMachines(1).then(({user, token}) =>
          request(app)
            .get('/machines/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should return 404 on other id', () =>
        dbUtils.populateMachines(1).then(({machine}) =>
          dbUtils.populateMachines(1).then(({user, token}) =>
            request(app)
              .get(`/machines/${machine.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(403)
              .then(res => assert.deepEqual(res.body, {message: 'Not allowed'})))))

      it('should succeed', () =>
        dbUtils.populateMachines(1).then(({user, token, machines}) =>
          request(app)
            .get(`/machines/${machines[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => assert.deepEqual(res.body, machines[0].toRest()))))

      it('should succeed when admin', () =>
        dbUtils.populateMachines(1).then(({machines}) =>
          request(app)
            .get(`/machines/${machines[0].model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(admin.model.id, admintoken.secret)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => assert.deepEqual(res.body, machines[0].toRest()))))

      it('should succeed when only user', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          dbUtils.populateMachines(1).then(({machine, laundry}) =>
            laundry.addUser(user)
              .then(() =>
                request(app)
                  .get(`/machines/${machine.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect('Content-Type', /json/)
                  .expect(200)
                  .then(res => assert.deepEqual(res.body, machine.toRest()))))))
    })
    describe('DELETE /machines/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/machines/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return 404 on invalid id', () =>
        dbUtils.populateMachines(1).then(({user, token}) =>
          request(app)
            .delete('/machines/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateMachines(1).then(({user, token}) =>
          request(app)
            .delete('/machines/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should return 404 on other id', () =>
        dbUtils.populateMachines(1).then(({machine}) =>
          dbUtils.populateMachines(1).then(({user, token}) =>
            request(app)
              .delete(`/machines/${machine.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token.secret)
              .expect('Content-Type', /json/)
              .expect(403)
              .then(res => assert.deepEqual(res.body, {message: 'Not allowed'})))))

      it('should succeed', () =>
        dbUtils.populateMachines(1).then(({user, token, machine}) =>
          request(app)
            .delete(`/machines/${machine.model.id}`)
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
            .delete(`/machines/${machine.model.id}`)
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
                  .delete(`/machines/${machine.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect('Content-Type', /json/)
                  .expect(403)
                  .then(res => assert.deepEqual(res.body, {message: 'Not allowed'}))))))
    })
  })
})
