// @flow

import request from 'supertest'
import promisedApp from '../../../../test_target/api/app'
import * as dbUtils from '../../../db_utils'
import UserHandler from '../../../../test_target/handlers/user'
import LaundryHandler from '../../../../test_target/handlers/laundry'
import TokenHandler from '../../../../test_target/handlers/token'
import UserModel from '../../../../test_target/db/models/user'
import assert from 'assert'
import { signAppToken } from '../../../../test_target/auth'
import faker from 'faker'

let app
const googlePlaceId = 'ChIJs4G9sJQ_TEYRHG0LNOr0w-I'
describe('controllers', function () {
  beforeEach(async () => {
    await dbUtils.clearDb()
    app = await promisedApp
  })
  describe('users', function () {
    this.timeout(5000)
    describe('GET /users/{id}', () => {
      it('should return error', () =>
        request(app)
          .get('/users/asd123')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404))

      it('should return error on missing but right format', () =>
        request(app)
          .get('/users/aaaaaaaaaaaaaaaaaaaaaaaa')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404))

      it('should find user', () =>
        dbUtils.populateTokens(1).then(({user}) =>
          request(app)
            .get(`/users/${user.model.id}`)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .then(res => {
              const u = user.toRest()
              const cleanUser = Object.keys(u).filter(k => u[k] !== undefined).reduce((o, k) => {
                o[k] = u[k]
                return o
              }, {})
              assert.deepEqual(res.body, cleanUser)
            })))

      it('should find user 2', () =>
        UserHandler
          .lib
          .createUserWithPassword('Foo Bob Bårsen', 'foo@bar.com', 'password')
          .then(user =>
            request(app)
              .get(`/users/${user.model.id}`)
              .set('Accept', 'application/json')
              .expect(200)
              .expect('Content-Type', /json/)
              .then(res => {
                const u = user.toRest()
                const cleanUser = Object.keys(u).filter(k => u[k] !== undefined).reduce((o, k) => {
                  o[k] = u[k]
                  return o
                }, {})
                assert.deepEqual(res.body, cleanUser)
              })))

      it('should find user 3', () => {
        return new UserModel({
          updatedAt: new Date('2016-09-23T06:39:16.495Z'),
          createdAt: new Date('2016-09-23T06:37:49.206Z'),
          latestProvider: 'local',
          profiles: [{
            id: 'asdasdasd@gmail.com',
            displayName: 'Bob Bobe Bobbesen',
            provider: 'local',
            photos: [{value: '/identicon/asdasdasd@gmail.com/150.svg'}],
            emails: [{value: 'asdasdasd@gmail.com'}],
            name: {givenName: 'Bob', middleName: 'Bobe', familyName: 'Bobbesen'}
          }],
          explicitVerificationEmailTokens: [],
          explicitVerifiedEmails: ['asdasdasd@gmail.com'],
          laundries: [],
          authTokens: [],
          password: 'asdasdasd',
          lastSeen: new Date('2016-09-23T06:38:33.364Z')
        })
          .save()
          .then(u => UserHandler.lib.findFromId(u.id))
          .then(user =>
            request(app)
              .get(`/users/${user.model.id}`)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .then(res => {
                const u = user.toRest()
                const cleanUser = Object.keys(u).filter(k => u[k] !== undefined).reduce((o, k) => {
                  o[k] = u[k]
                  return o
                }, {})
                assert.deepEqual(res.body, cleanUser)
              }))
      })
    })
    describe('PUT /users/{id}', () => {
      it('should fail on auth', () =>
        request(app)
          .put('/users/asd123')
          .send({name: 'Kurt Frandsen'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return error on missing but right format', () =>
        dbUtils
          .populateTokens(1)
          .then(({token, user}) =>
            request(app)
              .put('/users/aaaaaaaaaaaaaaaaaaaaaaaa')
              .send({name: 'Kurt Frandsen'})
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(404)))

      it('should update user', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          request(app)
            .put(`/users/${user.model.id}`)
            .auth(user.model.id, token.secret)
            .send({name: 'Kurt Frandsen'})
            .set('Accept', 'application/json')
            .expect(200)
            .then(res =>
              UserHandler.lib.find({_id: user.model._id})
                .then(([user]) => {
                  res.body.lastSeen = undefined
                  assert.equal(user.model.displayName, 'Kurt Frandsen')
                  assert.deepEqual(user.toRest(), res.body)
                }))))
      it('should update user when admin', () =>
        Promise
          .all([dbUtils.populateTokens(1), dbUtils.createAdministrator()])
          .then(([{user}, {user: admin, token}]) =>
            request(app)
              .put(`/users/${user.model.id}`)
              .auth(admin.model.id, token.secret)
              .send({name: 'Kurt Frandsen'})
              .set('Accept', 'application/json')
              .expect(200)
              .then(res =>
                UserHandler.lib.find({_id: user.model._id})
                  .then(([user]) => {
                    res.body.lastSeen = undefined
                    assert.equal(user.model.displayName, 'Kurt Frandsen')
                    assert.deepEqual(user.toRest(), res.body)
                  }))))
      it('should not update user', () =>
        Promise
          .all([
            dbUtils.populateTokens(1),
            dbUtils.populateTokens(1)
          ])
          .then(([{user: user1, token}, {user: user2}]) =>
            request(app)
              .put(`/users/${user2.model.id}`)
              .auth(user1.model.id, token.secret)
              .send({name: 'Kurt Frandsen'})
              .set('Accept', 'application/json')
              .expect(403)))
    })
    describe('POST /users/{id}/one-signal-player-ids', () => {
      it('should fail on auth', () =>
        request(app)
          .post('/users/asd123/one-signal-player-ids')
          .send({playerId: '9ce14842-2832-4d7d-9c3c-917038038612'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))
      it('should fail on other', async () => {
        const {token, user} = await dbUtils.populateTokens(1)
        const [user2] = await dbUtils.populateUsers(1)
        await request(app)
          .post(`/users/${user2.model.id}/one-signal-player-ids`)
          .auth(user.model.id, token.secret)
          .send({playerId: '9ce14842-2832-4d7d-9c3c-917038038612'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
      })
      it('should add', async () => {
        const {token, user} = await dbUtils.populateTokens(1)
        await request(app)
          .post(`/users/${user.model.id}/one-signal-player-ids`)
          .auth(user.model.id, token.secret)
          .send({playerId: '9ce14842-2832-4d7d-9c3c-917038038612'})
          .set('Accept', 'application/json')
          .expect(204)
        const newUser = await UserHandler.lib.findFromId(user.model.id)
        assert(newUser.model.oneSignalPlayerIds.indexOf('9ce14842-2832-4d7d-9c3c-917038038612') >= 0)
      })
      it('should fail on invalid id', async () => {
        const {token, user} = await dbUtils.populateTokens(1)
        await request(app)
          .post(`/users/${user.model.id}/one-signal-player-ids`)
          .auth(user.model.id, token.secret)
          .send({playerId: 'asd'})
          .set('Accept', 'application/json')
          .expect(400)
      })
      it('should not add twice', async () => {
        const {token, user} = await dbUtils.populateTokens(1)
        await request(app)
          .post(`/users/${user.model.id}/one-signal-player-ids`)
          .auth(user.model.id, token.secret)
          .send({playerId: '9ce14842-2832-4d7d-9c3c-917038038612'})
          .set('Accept', 'application/json')
          .expect(204)
        await request(app)
          .post(`/users/${user.model.id}/one-signal-player-ids`)
          .auth(user.model.id, token.secret)
          .send({playerId: '9ce14842-2832-4d7d-9c3c-917038038612'})
          .set('Accept', 'application/json')
          .expect(204)
        const newUser = await UserHandler.lib.findFromId(user.model.id)
        assert(newUser.model.oneSignalPlayerIds.indexOf('9ce14842-2832-4d7d-9c3c-917038038612') >= 0)
        assert.equal(newUser.model.oneSignalPlayerIds.length, 1)
      })
    })

    describe('POST /users/{id}/password-change', () => {
      it('should fail on auth', () =>
        request(app)
          .post('/users/asd123/password-change')
          .send({currentPassword: 'password', newPassword: 'password'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return error on missing but right format', () =>
        dbUtils
          .populateTokens(1)
          .then(({token, user}) =>
            request(app)
              .post('/users/aaaaaaaaaaaaaaaaaaaaaaaa/password-change')
              .send({currentPassword: 'password', newPassword: 'password'})
              .auth(user.model.id, token.secret)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(404)))

      it('should update user', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          user
            .resetPassword('password')
            .then(() =>
              request(app)
                .post(`/users/${user.model.id}/password-change`)
                .auth(user.model.id, token.secret)
                .send({currentPassword: 'password', newPassword: 'password2'})
                .set('Accept', 'application/json')
                .expect(204)
                .then(res => UserHandler
                  .lib.find({_id: user.model._id})
                  .then(([user]) => user
                    .verifyPassword('password2')
                    .then(r => Boolean(r))
                    .then(assert))))))

      it('should update user when no current password', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          request(app)
            .post(`/users/${user.model.id}/password-change`)
            .auth(user.model.id, token.secret)
            .send({currentPassword: 'password', newPassword: 'password2'})
            .set('Accept', 'application/json')
            .expect(204)
            .then(res => UserHandler
              .lib.find({_id: user.model._id})
              .then(([user]) => user
                .verifyPassword('password2')
                .then(r => Boolean(r))
                .then(assert)))))

      it('should fail with invalid input', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          request(app)
            .post(`/users/${user.model.id}/password-change`)
            .auth(user.model.id, token.secret)
            .send({currentPassword: 'p', newPassword: 'p2'})
            .set('Accept', 'application/json')
            .expect(400)))

      it('should fail with wrong current password', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          user
            .resetPassword('password')
            .then(() =>
              request(app)
                .post(`/users/${user.model.id}/password-change`)
                .auth(user.model.id, token.secret)
                .send({currentPassword: 'password1', newPassword: 'password2'})
                .set('Accept', 'application/json')
                .expect(403))))

      it('should not update user', () =>
        Promise
          .all([
            dbUtils.populateTokens(1),
            dbUtils.populateTokens(1)
          ])
          .then(([{user: user1, token}, {user: user2}]) =>
            request(app)
              .post(`/users/${user2.model.id}/password-change`)
              .auth(user1.model.id, token.secret)
              .send({currentPassword: 'password', newPassword: 'password'})
              .set('Accept', 'application/json')
              .expect(403)))
    })

    describe('POST /users/validate-credentials', () => {
      it('should fail on not authorized', async () => {
        await request(app)
          .post('/users/validate-credentials')
          .expect(401)
      })
      it('should fail on authenticated as user', async () => {
        const {user, token} = await dbUtils.populateTokens(1)
        await request(app)
          .post('/users/validate-credentials')
          .auth(user.model.id, token.secret)
          .send({email: 'test@test.dk', password: 'somePassword123'})
          .expect(403)
      })
      it('should fail on web but wrong cred', async () => {
        const jwt = await signAppToken('https://web.laundree.io', 'https://api.laundree.io')
        await request(app)
          .post('/users/validate-credentials')
          .set('Authorization', `Bearer ${jwt}`)
          .send({email: 'test@test.dk', password: 'somePassword123'})
          .expect(404)
      })
      it('should fail on web but wrong cred', async () => {
        const jwt = await signAppToken('https://web.laundree.io', 'https://api.laundree.io')
        await request(app)
          .post('/users/validate-credentials')
          .set('Authorization', `Bearer ${jwt}`)
          .send({email: 'test@test.dk', password: 'somePassword123'})
          .expect(404)
      })
      it('should succeed on web and right cred', async () => {
        const [user] = await dbUtils.populateUsers(1)
        await user.resetPassword('password1234')
        const jwt = await signAppToken('https://web.laundree.io', 'https://api.laundree.io')
        const res = await request(app)
          .post('/users/validate-credentials')
          .set('Authorization', `Bearer ${jwt}`)
          .send({email: user.model.emails[0], password: 'password1234'})
          .expect(200)
        assert.deepEqual(res.body, {userId: user.model.id, emailVerified: true})
      })
    })
    describe('POST /users/profile', () => {
      const profile = {
        provider: 'google',
        id: 'someId',
        displayName: 'Bob Bobbesen',
        name: {
          givenName: 'Bob',
          familyName: 'Bobbesen'
        },
        emails: [{
          value: 'bob@bobbesen.com'
        }]
      }
      it('should fail on not authorized', async () => {
        await request(app)
          .post('/users/profile')
          .expect(401)
      })
      it('should fail on authenticated as user', async () => {
        const {user, token} = await dbUtils.populateTokens(1)
        await request(app)
          .post('/users/profile')
          .auth(user.model.id, token.secret)
          .send(profile)
          .expect(403)
      })
      it('succeed as web', async () => {
        const jwt = await signAppToken('https://web.laundree.io', 'https://api.laundree.io')
        const {body} = await request(app)
          .post('/users/profile')
          .set('Authorization', `Bearer ${jwt}`)
          .send(profile)
          .expect(200)
        const user = await UserHandler.lib.findFromId(body.id)
        assert.deepEqual({...body, lastSeen: undefined, name: {...profile.name, middleName: undefined}}, user.toRest())
      })
    })
    describe('GET /users', () => {
      it('should return an empty list', () =>
        request(app)
          .get('/users')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect('Link', /rel=.first./)
          .expect(200)
          .then(res => assert.deepEqual(res.body, [])))

      it('should limit output size', () =>
        dbUtils.populateUsers(100).then((users) =>
          request(app)
            .get('/users')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => {
              const arr = users.slice(0, 10).map(UserHandler.restSummary)
              assert.deepEqual(res.body, arr)
            })))

      it('should allow custom output size', () =>
        dbUtils.populateUsers(100).then((users) =>
          request(app)
            .get('/users')
            .query({page_size: 12})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => {
              const arr = users.slice(0, 12).map(UserHandler.restSummary)
              assert.deepEqual(res.body, arr)
            })))

      it('should allow since', () =>
        dbUtils.populateUsers(100).then((users) =>
          request(app)
            .get('/users')
            .query({since: users[55].model.id, page_size: 1})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => assert.deepEqual(res.body, [UserHandler.restSummary(users[56])]))))

      it('should allow email filter', () =>
        dbUtils.populateUsers(10).then((users) =>
          request(app)
            .get('/users')
            .query({email: users[5].model.emails[0]})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => assert.deepEqual(res.body, [UserHandler.restSummary(users[5])]))))

      it('should allow email filter case insensitive', () =>
        dbUtils.populateUsers(10).then((users) =>
          request(app)
            .get('/users')
            .query({email: users[5].model.emails[0].toUpperCase()})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect('Link', /rel=.first./)
            .expect(200)
            .then(res => assert.deepEqual(res.body, [UserHandler.restSummary(users[5])]))))
    })

    describe('POST /users', () => {
      it('should succede with right body', () =>
        request(app)
          .post('/users')
          .send({displayName: 'Bob Bobbesen', email: 'bob@example.com', password: 'password1234'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(() => UserHandler.lib.findFromEmail('bob@example.com'))
          .then(assert))

      it('should fail on invalid email in body', () =>
        request(app)
          .post('/users')
          .send({displayName: 'Bob Bobbesen', email: 'invalid', password: 'password1234'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400))

      it('should fail on invalid name in body', () =>
        request(app)
          .post('/users')
          .send({displayName: '', email: 'a@example.com', password: 'password1234'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400))

      it('should fail on invalid password in body', () =>
        request(app)
          .post('/users')
          .send({displayName: 'Bob', email: 'a@example.com', password: 'asdfg'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400))
    })

    describe('POST /users/with-laundry', () => {
      it('should succeed with right body', async () => {
        const res = await request(app)
          .post('/users/with-laundry')
          .send({
            displayName: 'Bob Bobbesen',
            email: 'bob@example.com',
            password: 'password1234',
            name: faker.company.companyName(),
            googlePlaceId
          })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        const {user, laundry} = res.body
        assert(user)
        assert(laundry)
        assert(await UserHandler.lib.findFromId(user.id))
        assert(await LaundryHandler.lib.findFromId(laundry.id))
      })
      it('should fail on invalid email', async () => {
        await request(app)
          .post('/users/with-laundry')
          .send({
            displayName: 'Bob Bobbesen',
            email: 'bobexample.com',
            password: 'password1234',
            name: faker.company.companyName(),
            googlePlaceId
          })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
      })
      it('should fail on invalid name in body', () =>
        request(app)
          .post('/users/with-laundry')
          .send({
            displayName: '',
            email: 'a@example.com',
            password: 'password1234',
            name: faker.company.companyName(),
            googlePlaceId
          })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400))

      it('should fail on invalid password in body', () =>
        request(app)
          .post('/users/with-laundry')
          .send({
            displayName: 'Bob',
            email: 'a@example.com',
            password: 'asdfg',
            name: faker.company.companyName(),
            googlePlaceId
          })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400))

      it('should fail on invalid google place id', () =>
        request(app)
          .post('/users/with-laundry')
          .send({
            displayName: 'Bob',
            email: 'a@example.com',
            password: 'asdfg',
            name: faker.company.companyName(),
            googlePlaceId: 'foobar'
          })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400))

      it('should fail on duplicate email', async () => {
        const [user] = await dbUtils.populateUsers(1)
        await request(app)
          .post('/users/with-laundry')
          .send({
            displayName: 'Bob',
            email: user.model.emails[0],
            password: 'password1234',
            name: faker.company.companyName(),
            googlePlaceId
          })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(409)
      })
      it('should fail on duplicate laundry', async () => {
        const {laundry} = await dbUtils.populateLaundries(1)
        await request(app)
          .post('/users/with-laundry')
          .send({
            displayName: 'Bob',
            email: faker.internet.email(),
            password: 'password1234',
            name: laundry.model.name,
            googlePlaceId
          })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(409)
      })
    })
    describe('GET /users/{id}/emails', () => {
      it('should succeed on self', () => dbUtils
        .populateTokens(1)
        .then(({user, token}) => request(app)
          .get(`/users/${user.model.id}/emails`)
          .auth(user.model.id, token.secret)
          .send()
          .expect(200)
          .then(({body}) => assert.deepEqual(body, user.model.emails))))

      it('should succeed on admin', () =>
        Promise.all([dbUtils.populateTokens(1), dbUtils.createAdministrator()])
          .then(([{user}, {user: admin, token}]) => request(app)
            .get(`/users/${user.model.id}/emails`)
            .auth(admin.model.id, token.secret)
            .send()
            .expect(200)
            .then(({body}) => assert.deepEqual(body, user.model.emails))))

      it('should fail on other', () =>
        Promise.all([dbUtils.populateTokens(1), dbUtils.populateTokens(1)])
          .then(([{user}, {user: otherUser, token}]) => request(app)
            .get(`/users/${user.model.id}/emails`)
            .auth(otherUser.model.id, token.secret)
            .send()
            .expect(403)))

      it('should fail without auth', () =>
        Promise.all([dbUtils.populateTokens(1), dbUtils.populateTokens(1)])
          .then(([{user}, {user: otherUser, token}]) => request(app)
            .get(`/users/${user.model.id}/emails`)
            .send()
            .expect(401)))
    })
    describe('POST /users/{id}/start-password-reset', () => {
      it('should fail on no user', () =>
        dbUtils.populateUsers(2).then(() =>
          request(app)
            .post('/users/aaa/start-password-reset')
            .set('Accept', 'application/json')
            .send()
            .expect('Content-Type', /json/)
            .expect(404)))

      it('should fail on no user', () =>
        dbUtils.populateUsers(2).then(() =>
          request(app)
            .post('/users/aaaaaaaaaaaaaaaaaaaaaaaa/start-password-reset')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send()
            .expect('Content-Type', /json/)
            .expect(404)))

      it('should succeed', () =>
        dbUtils.populateUsers(1).then(([user]) =>
          request(app)
            .post(`/users/${user.model.id}/start-password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send()
            .expect(204)))
    })

    describe('POST /users/{id}/start-email-verification', () => {
      it('should fail on no user', () =>
        dbUtils.populateUsers(1).then(([user]) =>
          request(app)
            .post('/users/aaa/start-email-verification')
            .set('Accept', 'application/json')
            .send({email: user.model.emails[0]})
            .expect('Content-Type', /json/)
            .expect(404)))

      it('should fail on no user', () =>
        dbUtils.populateUsers(1).then(([user]) =>
          request(app)
            .post('/users/aaaaaaaaaaaaaaaaaaaaaaaa/start-email-verification')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: user.model.emails[0]})
            .expect('Content-Type', /json/)
            .expect(404)))

      it('should succeed', () =>
        dbUtils.populateUsers(1).then(([user]) =>
          request(app)
            .post(`/users/${user.model.id}/start-email-verification`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: user.model.emails[0]})
            .expect(204)))

      it('should succeed on crazy case', () =>
        dbUtils.populateUsers(1).then(([user]) =>
          request(app)
            .post(`/users/${user.model.id}/start-email-verification`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: user.model.emails[0].toUpperCase()})
            .expect(204)))

      it('should fail on wrong email', () =>
        dbUtils.populateUsers(1).then(([user]) =>
          request(app)
            .post(`/users/${user.model.id}/start-email-verification`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({email: 'not-right-' + user.model.emails[0]})
            .expect(400)))
    })

    describe('POST /users/{id}/password-reset', () => {
      it('should fail on no body', () =>
        dbUtils.populateUsers(2).then((users) =>
          request(app)
            .post(`/users/${users[0].model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({})
            .expect(400)))

      it('fail on no token', () =>
        dbUtils.populateUsers(2).then((users) =>
          request(app)
            .post(`/users/${users[0].model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: 'someToken', password: 'password1234'})
            .expect(400)))

      it('fail on invalid password', () =>
        dbUtils.populateUsers(1)
          .then(([user]) => user.generateResetToken().then((token) => ({user, token})))
          .then(({user, token}) =>
            request(app)
              .post(`/users/${user.model.id}/password-reset`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .send({token: token, password: 'pass'})
              .expect(400)))

      it('success on right token', () =>
        dbUtils.populateUsers(1)
          .then(([user]) => user.generateResetToken()
            .then(token => ({user, token: token.secret})))
          .then(({user, token}) =>
            request(app)
              .post(`/users/${user.model.id}/password-reset`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .send({token: token, password: 'password1234'})
              .expect(204)))

      it('fail on no invalid id', () =>
        request(app)
          .post('/users/aaa/password-reset')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({token: 'asdasdasdaasdsaasd', password: 'password1'})
          .expect(404))
    })

    describe('POST /users/{id}/verify-email', () => {
      it('should fail on no body', () =>
        dbUtils.populateUsers(2).then((users) =>
          request(app)
            .post(`/users/${users[0].model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({})
            .expect(400)))

      it('fail on no token', () =>
        dbUtils.populateUsers(2).then((users) =>
          request(app)
            .post(`/users/${users[0].model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: 'someToken', email: users[0].model.emails[0]})
            .expect(400)))

      it('fail on invalid email', () =>
        dbUtils.populateUsers(1)
          .then(([user]) => user.generateVerifyEmailToken(user.model.emails[0]).then((token) => ({user, token})))
          .then(({user, token}) => request(app)
            .post(`/users/${user.model.id}/password-reset`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: token, email: 'bob'})
            .expect(400)))

      it('success on right token', () =>
        dbUtils.populateUsers(1)
          .then(([user]) => user.generateVerifyEmailToken(user.model.emails[0])
            .then(token => ({user, token: token.secret})))
          .then(({user, token}) => request(app)
            .post(`/users/${user.model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token, email: user.model.emails[0]})
            .expect(204)))

      it('success on crazy case token', () =>
        dbUtils.populateUsers(1)
          .then(([user]) => user.generateVerifyEmailToken(user.model.emails[0])
            .then(token => ({user, token: token.secret})))
          .then(({user, token}) => request(app)
            .post(`/users/${user.model.id}/verify-email`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({token: token, email: user.model.emails[0].toUpperCase()})
            .expect(204)))

      it('fail on no invalid id', () =>
        request(app)
          .post('/users/aaa/verify-email')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({token: 'asdasdasdaasdsaasd', email: 'bob@bobs.dk'})
          .expect(404))
    })
    describe('DELETE /users/{id}', () => {
      it('should fail on not authenticated', () =>
        request(app)
          .delete('/users/id')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401))

      it('should return 403 on invalid id', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .delete('/users/id')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should return 404 on missing id', () =>
        dbUtils.populateTokens(1).then(({user, tokens}) =>
          request(app)
            .delete('/users/aaaaaaaaaaaaaaaaaaaaaaaa')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, tokens[0].secret)
            .expect('Content-Type', /json/)
            .expect(404)
            .then(res => assert.deepEqual(res.body, {message: 'Not found'}))))

      it('should return 403 on other id', () =>
        dbUtils.populateTokens(1).then(({user: user1}) =>
          dbUtils.populateTokens(1).then(({user, token: token2}) =>
            request(app)
              .delete(`/users/${user1.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(user.model.id, token2.secret)
              .expect(403)
              .expect('Content-Type', /json/)
              .then(res => assert.deepEqual(res.body, {message: 'Not allowed'})))))

      it('should succeed', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          request(app)
            .delete(`/users/${user.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(204)
            .then(res =>
              Promise.all([UserHandler.lib.findFromId(user.model.id), TokenHandler.lib.findFromId(token.model.id)])
                .then((result) => assert.deepEqual(result, [null, null])))))

      it('should succeed when admin', () =>
        Promise.all([dbUtils.populateTokens(1), dbUtils.createAdministrator()])
          .then(([{user}, {user: admin, token}]) =>
            request(app)
              .delete(`/users/${user.model.id}`)
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .auth(admin.model.id, token.secret)
              .expect(204)
              .then(res =>
                UserHandler.lib.findFromId(user.model.id)
                  .then((result) => assert(!result)))))

      it('should fail on owner', () =>
        dbUtils.populateLaundries(1).then(({user, token}) =>
          request(app)
            .delete(`/users/${user.model.id}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .auth(user.model.id, token.secret)
            .expect(403)
            .expect('Content-Type', /json/)
            .then(res => assert.deepEqual(res.body, {message: 'Not allowed'}))))

      it('should succeed when only user', () =>
        dbUtils.populateTokens(1).then(({user, token}) =>
          dbUtils.populateLaundries(1).then(({laundry}) =>
            laundry.addUser(user)
              .then(() =>
                request(app)
                  .delete(`/users/${user.model.id}`)
                  .set('Accept', 'application/json')
                  .set('Content-Type', 'application/json')
                  .auth(user.model.id, token.secret)
                  .expect(204)
                  .then(res => Promise
                    .all([UserHandler.lib.findFromId(user.model.id), TokenHandler.lib.findFromId(token.model.id)])
                    .then((result) => assert.deepEqual(result, [null, null])))))))
    })
  })
})
