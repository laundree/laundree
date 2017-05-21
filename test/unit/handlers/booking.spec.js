/**
 * Created by budde on 27/04/16.
 */

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()
const dbUtils = require('../../db_utils')
const clearDb = dbUtils.clearDb

describe('handlers', () => {
  describe('BookingHandler', function () {
    this.timeout(20000)
    beforeEach(() => clearDb())

    describe('updateActions', () => {
      it('should work with no change', () => dbUtils
        .populateBookings(1)
        .then(({booking}) => booking.updateDocument()))

      it('should work with no change', () => dbUtils
        .populateBookings(1)
        .then(({booking}) => {
          booking.model.docVersion = 0
          return booking.save().then(() => booking.updateDocument())
        })
        .then(booking => {
          booking.model.docVersion.should.equal(1)
        }))
    })
    describe('fetchMachine', () => {
      it('should fetch machine', () => dbUtils
        .populateBookings(1)
        .then(({machine, booking}) => booking.fetchMachine()
          .then(machine2 => machine2.model.id.should.equal(machine.model.id))))
    })
  })
})
