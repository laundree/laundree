// @flow

import { clearDb, populateLaundries } from '../../db_utils'
import UserHandler from '../../../test_target/handlers/user'
import LaundryHandler from '../../../test_target/handlers/laundry'
import assert from 'assert'

describe('handlers', () => {
  describe('LaundryHandler', () => {
    let laundry, demoUser
    beforeEach(async () => {
      await clearDb()
      const [{user}, {laundry: l}] = await Promise.all([UserHandler.lib.createDemoUser(), populateLaundries(1)])
      laundry = l
      demoUser = user
    })
    it('should not be possible to add demo user to laundry', async () => {
      const result = await laundry
        .addUser(demoUser)
      assert(result === 0)
    })
    it('should be possible to create demo laundry', async () => {
      await LaundryHandler.lib.createDemoLaundry(demoUser)
      const user = await UserHandler.lib.findFromId(demoUser.model.id)
      const laundries = await user.fetchLaundries()
      assert(laundries.length === 1)
    })
  })
})
