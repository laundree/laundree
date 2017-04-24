/**
 * Created by budde on 27/04/16.
 */

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()
const {clearDb, populateLaundries} = require('../../db_utils')
const {UserHandler, LaundryHandler} = require('../../../handlers')

describe('handlers', () => {
  describe('LaundryHandler', () => {
    let laundry, demoUser
    beforeEach(() => clearDb()
      .then(() => Promise
        .all([UserHandler.createDemoUser(), populateLaundries(1)])
        .then(([{user}, {laundry: l}]) => {
          laundry = l
          demoUser = user
        })))
    it('should not be possible to add demo user to laundry', () => laundry
      .addUser(demoUser)
      .then(result => {
        result.should.equal(0)
      }))
    it('should be possible to create demo laundry', () => LaundryHandler.createDemoLaundry(demoUser)
      .then(() => UserHandler.findFromId(demoUser.model.id)
        .then(user => user.fetchLaundries())
        .then(laundries => laundries.length.should.equal(1))))
  })
})
