/**
 * Created by budde on 09/06/16.
 */

const Handler = require('./handler')
const {BookingModel} = require('../models')

class BookingHandler extends Handler {

  static findFromId (id) {
    Handler._findFromId(BookingModel, BookingHandler, id)
  }

  static find (filter, limit = 10) {
    Handler._find(BookingModel, BookingHandler, filter, limit)
  }

  /**
   * Create a new booking
   * @param {MachineHandler} machine
   * @param {UserHandler} owner
   * @param {Date} from
   * @param {Date} to
   * @returns {Promise.<BookingHandler>}
   */
  static _createBooking (machine, owner, from, to) {
    return new BookingModel({machine: machine.model._id, owner: owner.model._id, from, to})
  }

  toRestSummary () {
    return {id: this.model.id, href: `/api/bookings/${this.model.id}`}
  }

  toRest () {
    return Promise.resolve({
      id: this.model.id,
      href: `/api/bookings/${this.model.id}`,
      from: this.model.from,
      to: this.model.to
    })
  }
}

module.exports = BookingHandler
