/**
 * Created by budde on 27/04/16.
 */
const Promise = require('promise')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()
const dbUtils = require('../../db_utils')
const clearDb = dbUtils.clearDb
const {UserHandler, LaundryInvitationHandler, LaundryHandler} = require('../../../handlers')
const assert = chai.assert

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
    let user = null

    beforeEach(() => clearDb().then(() => UserHandler.createUserFromProfile(profile)).then((u) => {
      user = u
    }))

    describe('createUserFromProfile', () => {
      it('should set role', () => user.model.role.should.equal('user'))

      it('should set role from config', () => UserHandler
        .createUserFromProfile(Object.assign({}, profile, {emails: [{value: 'test-admin@example.com'}]}))
        .then(user => user.model.role.should.equal('admin')))

      it('should add laundry if invitations on creation', () =>
        user.createLaundry('Bobs Laundry').then((laundry) =>
          laundry
            .inviteUserByEmail('alice@example.com')
            .then(() => UserHandler
              .createUserFromProfile(Object.assign({}, profile, {emails: [{value: 'alice@example.com'}]}))
              .then((user) => {
                user.model.laundries.should.have.length(1)
                user.model.laundries[0].toString().should.equal(laundry.model.id)
                return LaundryHandler
                  .find({_id: laundry.model._id})
                  .then(([laundry]) => {
                    Boolean(laundry.isUser(user)).should.be.true
                    return LaundryInvitationHandler
                      .find({email: 'alice@example.com'})
                      .then((results) => {
                        results.should.have.length(1)
                        results[0].model.used.should.be.true
                      })
                  })
              }))))
    })
    describe('emitEvent', () => {
      it('should log', () => {
        user.fetchEvents()
          .then(events => events.should.have.length(1))
          .then(() => user.emitEvent('update'))
          .then(() => user.fetchEvents())
          .then(events => events.should.have.length(2))
      })
    })

    describe('findFromEmail', () => {
      it('should be possible to find existing profiles from email',
        () => UserHandler.findFromEmail('bob@example.com').should.eventually.not.be.undefined)
    })

    describe('updateProfile', () => {
      it('should update', () => user.updateProfile({
        provider: 'google',
        id: 'someId',
        displayName: 'Bob Bobbesen',
        emails: [{value: 'bob@example.com'}],
        name: {familyName: 'Bobbesen', givenName: 'Bob'},
        photos: [{value: 'http://example.com/foo.jpeg'}]
      }).then((user) => {
        user.model.latestProvider.should.be.equal('google')
        user.model.photo.should.be.equal('http://example.com/foo.jpeg')
      }))
    })

    describe('findOrCreateFromProfile', () => {
      it('should find existing user', () => UserHandler.findOrCreateFromProfile(profile).then((u) => {
        u.model.id.should.be.deep.equal(user.model.id)
      }))

      it('should create new user', () => {
        profile.emails[0].value = 'new@example.com'
        profile.id = '1231312312312312'
        return UserHandler.findOrCreateFromProfile(profile).then((u) => {
          u.model.id.should.not.be.deep.equal(user.model.id)
        })
      })
    })
    describe('findFromId', () => {
      it('should find right',
        () => UserHandler.findFromId(user.model.id).then((u) => u.model.id.should.equal(user.model.id)))
      it('should reject on error',
        () => UserHandler.findFromId(user.model.id + 'asd').should.eventually.be.undefined)
      it('should reject on error',
        () => UserHandler.findFromId('aaaaaaaaaaaaaaaaaaaa').should.eventually.be.undefined)
    })

    describe('resetPassword', () => {
      it('should reset the password', () => user.resetPassword('password12345').then((user) => {
        return user.verifyPassword('password12345').should.eventually.be.true
      }))
      it('should remove reset token', () => user.generateResetToken()
        .then((token) => user.resetPassword('asd1234')
          .then(() => user.verifyResetPasswordToken(token).should.eventually.be.false)))
    })

    describe('verifyResetPasswordToken', () => {
      it('should verify', () => user.generateResetToken()
        .then((token) => user.verifyResetPasswordToken(token).should.eventually.be.true))
    })

    describe('createUserWithPassword', () => {
      it('should create user', () =>
        UserHandler.createUserWithPassword('Alice Alison', 'ali@example.com', 'password1234')
          .then((user) => {
            user.model.name.familyName.should.be.equal('Alison')
            user.model.name.givenName.should.be.equal('Alice')
            assert(user.model.name.middleName === undefined)
            user.model.displayName.should.be.equal('Alice Alison')
            return user.verifyPassword('password1234').should.eventually.be.true
          }))
      it('should create user with more names', () =>
        UserHandler.createUserWithPassword('Alice Alu   Ali Alison', 'ali@example.com', 'password1234')
          .then((user) => {
            user.model.name.familyName.should.be.equal('Alison')
            user.model.name.givenName.should.be.equal('Alice')
            user.model.name.middleName.should.be.equal('Alu Ali')
            user.model.displayName.should.be.equal('Alice Alu Ali Alison')
            return user.verifyPassword('password1234').should.eventually.be.true
          }))
    })
    describe('generateVerifyEmailToken', () => {
      it('should generate a token', () =>
        dbUtils.populateUsers(1).then((users) => {
          const [user] = users
          return user.generateVerifyEmailToken(user.model.emails[0]).should.eventually.not.be.undefined
        }))
      it('should not generate token for non-registered email', () =>
        dbUtils.populateUsers(1).then((users) => {
          const [user] = users
          return user.generateVerifyEmailToken('not-valid' + user.model.emails[0]).should.eventually.be.undefined
        }))
      it('should generate a new token', () =>
        dbUtils.populateUsers(1).then((users) => {
          const [user] = users
          return Promise.all([
            user.generateVerifyEmailToken(user.model.emails[0]),
            user.generateVerifyEmailToken(user.model.emails[0])
          ]).then((tokens) => {
            const [token1, token2] = tokens
            token1.should.not.equal(token2)
          })
        }))
    })
    describe('seen', () => {
      it('should return date', () => dbUtils.populateUsers(1).then((users) => {
        const [user] = users
        user.seen().should.eventually.be.an.instanceof(Date)
      }))
      it('should update lastSeen', () => dbUtils.populateUsers(1).then((users) => {
        const [user] = users
        user.seen().then((time) => {
          user.model.lastSeen.should.be.equal(time)
        })
      }))
    })
    describe('verifyEmail', () => {
      it('should resolve to true', () => dbUtils.populateUsers(1).then((users) => {
        const [user] = users
        const email = user.model.emails[0]
        return user.generateVerifyEmailToken(email)
          .then((token) => user.verifyEmail(email, token))
          .should.eventually.be.true
      }))
      it('explicit verify email', () => dbUtils.populateUsers(1).then((users) => {
        const [user] = users
        const email = user.model.emails[0]
        return user.generateVerifyEmailToken(email)
          .then((token) => user.verifyEmail(email, token))
          .then(() => user.model.explicitVerifiedEmails)
          .should.eventually.contain(email)
      }))

      it('should resolve to false', () => dbUtils.populateUsers(1).then((users) => {
        const [user] = users
        const email = user.model.emails[0]
        return user.generateVerifyEmailToken(email)
          .then((token) => user.verifyEmail(email, token + 'asd'))
          .should.eventually.be.false
      }))

      it('should resolve to false', () => dbUtils.populateUsers(1).then((users) => {
        const [user] = users
        const email = user.model.emails[0]
        return user.verifyEmail(email, 'tokenbob1').should.eventually.be.false
      }))
      it('should verify latest', () =>
        dbUtils.populateUsers(1).then((users) => {
          const [user] = users
          const email = user.model.emails[0]
          return user.generateVerifyEmailToken(email).then((token1) =>
            user.generateVerifyEmailToken(email).then((token2) => [token1, token2]))
            .then((tokens) => {
              const [token1, token2] = tokens
              return Promise.all([user.verifyEmail(email, token1), user.verifyEmail(email, token2)])
            })
            .should.eventually.deep.equal([false, true])
        }))
      it('should remove old', () =>
        dbUtils.populateUsers(1).then((users) => {
          const [user] = users
          const email = user.model.emails[0]
          return user.generateVerifyEmailToken(email).then((token1) =>
            user.generateVerifyEmailToken(email).then((token2) => [token1, token2]))
            .then((tokens) => {
              const [token1, token2] = tokens
              return Promise.all([user.verifyEmail(email, token2), user.verifyEmail(email, token1)])
            })
            .should.eventually.deep.equal([true, false])
        }))
      it('should not verify twice', () =>
        dbUtils.populateUsers(1).then((users) => {
          const [user] = users
          const email = user.model.emails[0]
          return user.generateVerifyEmailToken(email).then((token1) =>
            user.verifyEmail(email, token1).then((result1) =>
              Promise.all([result1, user.verifyEmail(email, token1)]))
              .should.eventually.deep.equal([true, false]))
        }))
    })
    describe('generateCalendarToken', () => {
      it('should generate token', () => user.generateCalendarToken()
        .then(token => token.should.not.be.empty))
      it('should generate new', () => Promise.all([user.generateCalendarToken(), user.generateCalendarToken()])
        .then(([t1, t2]) => t1.should.not.equal(t2)))
    })
    describe('verifyCalendarToken', () => {
      it('should fail on invalid token', () => user.verifyCalendarToken('invalid')
        .then(result => result.should.be.false))
      it('should succeed w token', () => user.generateCalendarToken()
        .then(token => user.verifyCalendarToken(token))
        .then(result => result.should.be.true))
      it('should succeed with more tokens', () => Promise.all([user.generateCalendarToken(), user.generateCalendarToken()])
        .then(([token]) => user.verifyCalendarToken(token))
        .then(result => result.should.be.true))
    })
    describe('findAuthTokenFromSecret', () => {
      it('should right token find', () =>
        dbUtils.populateTokens(10)
          .then(({user, tokens}) =>
            user.findAuthTokenFromSecret(tokens[9].secret)
              .then((token) => token.model.id.should.deep.equal(tokens[9].model.id))))
    })
  })
})
