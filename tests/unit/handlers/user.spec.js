/**
 * Created by budde on 27/04/16.
 */

var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()
var clearDb = require('../../db_utils').clearDb
var UserHandler = require('../../../handlers').UserHandler

describe('UserHandler', function () {
  this.timeout(5000)
//  var userHandler
  var profile = {
    provider: 'facebook',
    id: 'someId',
    displayName: 'Bob Bobbesen',
    emails: [{value: 'bob@example.com'}],
    name: {familyName: 'Bobbesen', givenName: 'Bob'}
  }
  beforeEach(() => clearDb().then(() => UserHandler.createUserFromProfile(profile)).then((handler) => {
//    userHandler = handler
  }))

  describe('findFromEmail', () => {
    it('should be possible to find existing profiles from email',
      () => UserHandler.findFromEmail('bob@example.com').should.eventually.not.be.undefined)
  })
})
