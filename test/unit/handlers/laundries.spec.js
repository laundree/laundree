/**
 * Created by budde on 27/04/16.
 */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {clearDb, populateLaundries} from '../../db_utils'
import UserHandler from '../../../test_target/handlers/user'
import LaundryHandler from '../../../test_target/handlers/laundry'
chai.use(chaiAsPromised)
chai.should()

describe('handlers', () => {
  describe('LaundryHandler', () => {
    let laundry, demoUser
    beforeEach(() => clearDb()
      .then(() => Promise
        .all([UserHandler.lib.createDemoUser(), populateLaundries(1)])
        .then(([{user}, {laundry: l}]) => {
          laundry = l
          demoUser = user
        })))
    it('should not be possible to add demo user to laundry', () => laundry
      .addUser(demoUser)
      .then(result => {
        result.should.equal(0)
      }))
    it('should be possible to create demo laundry', () => LaundryHandler.lib.createDemoLaundry(demoUser)
      .then(() => UserHandler.lib.findFromId(demoUser.model.id)
        .then(user => user.fetchLaundries())
        .then(laundries => laundries.length.should.equal(1))))
  })
})
