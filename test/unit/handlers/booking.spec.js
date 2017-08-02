// @flow

import * as dbUtils from '../../db_utils'
import assert from 'assert'

const clearDb = dbUtils.clearDb

describe('handlers', () => {
  describe('BookingHandler', function () {
    this.timeout(20000)
    beforeEach(() => clearDb())

    describe('updateActions', () => {
      it('should work with no change', async () => {
        const {booking} = await dbUtils.populateBookings(1)
        booking.updateDocument()
      })

      it('should work with no change', async () => {
        const {booking} = await dbUtils.populateBookings(1)
        booking.model.docVersion = 0
        await booking.save()
        await booking.updateDocument()
        assert(booking.model.docVersion === 1)
      })
    })
    describe('fetchMachine', () => {
      it('should fetch machine', async () => {
        const {machine, booking} = await dbUtils.populateBookings(1)
        const machine2 = await booking.fetchMachine()
        assert(machine2.model.id === machine.model.id)
      })
    })
  })
})
