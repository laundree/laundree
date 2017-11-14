// @flow

import * as dbUtils from '../../db_utils'
import UserHandler from '../../../test_target/handlers/user'
import LaundryInvitationHandler from '../../../test_target/handlers/laundry_invitation'
import LaundryHandler from '../../../test_target/handlers/laundry'
import assert from 'assert'
import faker from 'faker'

const clearDb = dbUtils.clearDb

describe('handlers', () => {
  describe('UserHandler', function () {
    this.timeout(20000)
    const profile = {
      provider: 'facebook',
      id: 'someId',
      displayName: 'Bob Bobbesen',
      emails: [{value: 'bob@example.com'}],
      name: {familyName: 'Bobbesen', givenName: 'Bob'}
    }
    let user: UserHandler, laundry: LaundryHandler

    beforeEach(async () => {
      await clearDb()
      user = await UserHandler.lib.createUserFromProfile(profile)
      const {laundry: l} = await dbUtils.populateLaundries(1)
      laundry = l
    })

    describe('createUserFromProfile', () => {
      it('should set role', () => assert.equal(user.model.role, 'user'))

      it('should set role from config', () => UserHandler
        .lib
        .createUserFromProfile(Object.assign({}, profile, {emails: [{value: 'test-admin@example.com'}]}))
        .then(user => assert.equal(user.model.role, 'admin')))

      it('should add laundry if invitations on creation', () =>
        user.createLaundry('Bobs Laundry').then((laundry) =>
          laundry
            .inviteUserByEmail('alice@example.com')
            .then(() => UserHandler
              .lib
              .createUserFromProfile(Object.assign({}, profile, {emails: [{value: 'alice@example.com'}]}))
              .then((user) => {
                assert.equal(1, user.model.laundries.length)
                assert.equal(user.model.laundries[0].toString(), laundry.model.id)
                return LaundryHandler
                  .lib
                  .find({_id: laundry.model._id})
                  .then(([laundry]) => {
                    assert(laundry.isUser(user))
                    return LaundryInvitationHandler
                      .lib
                      .find({email: 'alice@example.com'})
                      .then((results) => {
                        assert.equal(1, results.length)
                        assert(results[0].model.used)
                      })
                  })
              }))))
    })

    describe('findFromEmail', () => {
      it('should be possible to find existing profiles from email',
        () => UserHandler.lib.findFromEmail('bob@example.com').then(assert))
    })

    describe('updateProfile', () => {
      it('should update', () => user
        .updateProfile({
          provider: 'google',
          id: 'someId',
          displayName: 'Bob Bobbesen',
          emails: [{value: 'bob@example.com'}],
          name: {familyName: 'Bobbesen', givenName: 'Bob'},
          photos: [{value: 'http://example.com/foo.jpeg'}]
        })
        .then((user) => {
          assert.equal(user.model.latestProvider, 'google')
          assert.equal(user.model.photo, 'http://example.com/foo.jpeg')
        }))
    })

    describe('findOrCreateFromProfile', () => {
      it('should find existing user', () => UserHandler.lib.findOrCreateFromProfile(profile).then((u) => {
        assert.equal(u.model.id, user.model.id)
      }))

      it('should create new user', () => {
        profile.emails[0].value = 'new@example.com'
        profile.id = '1231312312312312'
        return UserHandler.lib.findOrCreateFromProfile(profile).then((u) => {
          assert.notEqual(u.model.id, user.model.id)
        })
      })
    })
    describe('findFromId', () => {
      it('should find right',
        () => UserHandler.lib.findFromId(user.model.id).then((u) => assert.equal(u.model.id, user.model.id)))
      it('should reject on error',
        () => UserHandler.lib.findFromId(user.model.id + 'asd').then(r => !r).then(assert))
      it('should reject on error',
        () => UserHandler.lib.findFromId('aaaaaaaaaaaaaaaaaaaa').then(r => !r).then(assert))
    })

    describe('resetPassword', () => {
      it('should reset the password', () => user.resetPassword('password12345')
        .then(() => user.verifyPassword('password12345'))
        .then(assert))
      it('should remove reset token', () => user.generateResetToken()
        .then((token) => user.resetPassword('asd1234')
          .then(() => user.verifyResetPasswordToken(token)
            .then(r => assert(!r)))))
    })

    describe('verifyResetPasswordToken', () => {
      it('should verify', () => user.generateResetToken()
        .then(token => user.verifyResetPasswordToken(token.secret))
        .then(assert))
    })

    describe('createUserWithPassword', () => {
      it('should create user', () =>
        UserHandler.lib.createUserWithPassword('Alice Alison', 'ali@example.com', 'password1234')
          .then((user) => {
            assert.equal(user.model.name.familyName, 'Alison')
            assert.equal(user.model.name.givenName, 'Alice')
            assert(user.model.name.middleName === undefined)
            assert.equal(user.model.displayName, 'Alice Alison')
            return user.verifyPassword('password1234')
          })
          .then(assert))

      it('should create user with more names', () =>
        UserHandler.lib.createUserWithPassword('Alice Alu   Ali Alison', 'ali@example.com', 'password1234')
          .then((user) => {
            assert.equal(user.model.name.familyName, 'Alison')
            assert.equal(user.model.name.givenName, 'Alice')
            assert.equal(user.model.name.middleName, 'Alu Ali')
            assert.equal(user.model.displayName, 'Alice Alu Ali Alison')
            return user.verifyPassword('password1234')
          })
          .then(assert))
    })
    describe('generateVerifyEmailToken', () => {
      it('should generate a token', () =>
        dbUtils.populateUsers(1)
          .then((users) => {
            const [user] = users
            return user.generateVerifyEmailToken(user.model.emails[0])
          })
          .then(assert))
      it('should not generate token for non-registered email', () =>
        dbUtils.populateUsers(1)
          .then((users) => {
            const [user] = users
            return user.generateVerifyEmailToken('not-valid' + user.model.emails[0])
          })
          .then(r => assert(!r)))
      it('should generate a new token', () =>
        dbUtils.populateUsers(1).then((users) => {
          const [user] = users
          return Promise.all([
            user.generateVerifyEmailToken(user.model.emails[0]),
            user.generateVerifyEmailToken(user.model.emails[0])
          ]).then((tokens) => {
            const [token1, token2] = tokens
            assert.notEqual(token1, token2)
          })
        }))
    })
    describe('seen', () => {
      it('should return date', () => dbUtils.populateUsers(1)
        .then((users) => {
          const [user] = users
          return user.seen()
        })
        .then(r => assert.equal(typeof r.toISOString(), 'string')))
      it('should update lastSeen', () => dbUtils.populateUsers(1).then((users) => {
        const [user] = users
        return user.seen().then((time) => {
          assert.equal(user.model.lastSeen, time)
        })
      }))
    })
    describe('verifyEmail', () => {
      it('should resolve to true', () => dbUtils.populateUsers(1).then(users => {
        const [user] = users
        const email = user.model.emails[0]
        return user.generateVerifyEmailToken(email)
          .then(token => user.verifyEmail(email, token.secret))
          .then(assert)
      }))
      it('explicit verify email', () => dbUtils.populateUsers(1).then((users) => {
        const [user] = users
        const email = user.model.emails[0]
        return user.generateVerifyEmailToken(email)
          .then(token => user.verifyEmail(email, token.secret))
          .then(() => user.model.explicitVerifiedEmails)
          .then(r => assert(r.indexOf(email) >= 0))
      }))

      it('should resolve to false', () => dbUtils.populateUsers(1).then((users) => {
        const [user] = users
        const email = user.model.emails[0]
        return user.generateVerifyEmailToken(email)
          .then(token => user.verifyEmail(email, token.secret + 'asd'))
          .then(r => assert(!r))
      }))

      it('should resolve to false', () => dbUtils.populateUsers(1)
        .then((users) => {
          const [user] = users
          const email = user.model.emails[0]
          return user.verifyEmail(email, 'tokenbob1')
        })
        .then(r => assert(!r)))
      it('should verify latest', () =>
        dbUtils.populateUsers(1).then((users) => {
          const [user] = users
          const email = user.model.emails[0]
          return user.generateVerifyEmailToken(email)
            .then(token1 => user.generateVerifyEmailToken(email)
              .then(token2 => Promise.all([user.verifyEmail(email, token1.secret), user.verifyEmail(email, token2.secret)])))
            .then(r => assert.deepEqual(r, [false, true]))
        }))
      it('should remove old', () =>
        dbUtils.populateUsers(1).then((users) => {
          const [user] = users
          const email = user.model.emails[0]
          return user.generateVerifyEmailToken(email)
            .then(token1 =>
              user.generateVerifyEmailToken(email)
                .then(token2 => Promise.all([user.verifyEmail(email, token2.secret), user.verifyEmail(email, token1.secret)])))
            .then(r => assert.deepEqual(r, [true, false]))
        }))
      it('should not verify twice', () =>
        dbUtils.populateUsers(1).then((users) => {
          const [user] = users
          const email = user.model.emails[0]
          return user.generateVerifyEmailToken(email).then(token1 =>
            user.verifyEmail(email, token1.secret).then(result1 =>
              Promise.all([result1, user.verifyEmail(email, token1.secret)])))
            .then(r => assert.deepEqual(r, [true, false]))
        }))
    })
    describe('addLaundriesFromInvites', () => {
      it('should delete the invitations', async () => {
        const email = faker.internet.email()
        const {invite}: {invite?: LaundryInvitationHandler} = await laundry.inviteUserByEmail(email)
        assert(invite)
        if (!invite) return
        assert(!invite.model.used)
        const u = await UserHandler.lib.createUserFromProfile({...profile, emails: [{value: email}]})
        assert(u)
        const invite2 = await LaundryInvitationHandler.lib.findFromId(invite.model.id)
        assert(invite2)
        assert(invite2.model.used)
        await u.deleteUser()
        const {invite: invite3}: {invite?: LaundryInvitationHandler} = await laundry.inviteUserByEmail(email)
        assert(!invite3)
        const invite4 = await LaundryInvitationHandler.lib.findFromId(invite.model.id)
        assert(!invite4.model.used)
      })
    })
    describe('generateCalendarToken', () => {
      it('should generate token', () => user.generateCalendarToken(faker.name.findName())
        .then(assert))
      it('should generate new', () => Promise.all([user.generateCalendarToken(faker.name.findName()), user.generateCalendarToken(faker.name.findName())])
        .then(([t1, t2]) => assert.notEqual(t1, t2)))
    })
    describe('verifyCalendarToken', () => {
      it('should fail on invalid token', () => user.verifyCalendarToken('invalid')
        .then(result => assert(!result)))
      it('should succeed w token', () => user.generateCalendarToken(faker.name.findName())
        .then(token => user.verifyCalendarToken(token.secret))
        .then(assert))
      it('should succeed with more tokens', () => Promise.all([user.generateCalendarToken(faker.name.findName()), user.generateCalendarToken(faker.name.findName())])
        .then(([token]) => user.verifyCalendarToken(token.secret))
        .then(assert))
    })
    describe('findAuthTokenFromSecret', () => {
      it('should right token find', async () => {
        const {user, tokens} = await (dbUtils.populateTokens(10): Promise<*>)
        const t = tokens[9].secret
        if (!t) throw new Error('Wat')
        const token = await (user.findAuthTokenFromSecret(t): Promise<*>)
        if (!token) throw new Error('Wat')
        assert.deepEqual(token.model.id, tokens[9].model.id)
      })
      it('should right old token find', async () => {
        const {user, tokens} = await (dbUtils.populateTokens(10): Promise<*>)
        const t = tokens[9].secret
        if (!t) throw new Error('Wat')
        const token = await (user.findAuthTokenFromSecret(t.split('.')[2]): Promise<*>)
        if (!token) throw new Error('Wat')
        assert.deepEqual(token.model.id, tokens[9].model.id)
      })
    })
  })
})
