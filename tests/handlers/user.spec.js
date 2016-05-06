/**
 * Created by budde on 27/04/16.
 */

var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()
var clearDb = require('../db_utils').clearDb
var UserHandler = require('../../handlers').UserHandler
var assert = chai.assert
describe('handlers', () => {
  describe('UserHandler', function () {
    this.timeout(20000)
    var profile = {
      provider: 'facebook',
      id: 'someId',
      displayName: 'Bob Bobbesen',
      emails: [{value: 'bob@example.com'}],
      name: {familyName: 'Bobbesen', givenName: 'Bob'}
    }
    var user = null

    beforeEach(() => clearDb().then(() => UserHandler.createUserFromProfile(profile)).then((u) => {
      user = u
    }))

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
        () => UserHandler.findFromId(user.model.id + 'asd').should.be.rejected)
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
  })
})
