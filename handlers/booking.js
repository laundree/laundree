/**
 * Created by budde on 09/06/16.
 */

const Handler = require('./handler')
const {BookingModel} = require('../models')

class BookingHandler extends Handler {

  static findFromId (id) {
    return Handler._findFromId(BookingModel, BookingHandler, id)
  }

  static find (filter, limit = 10) {
    return Handler._find(BookingModel, BookingHandler, filter, limit)
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
      .save()
      .then((model) => new BookingHandler(model))
  }

  /**
   * Fetch machine
   * @return {Promise.<MachineHandler>}
   */
  fetchMachine () {
    const MachineHandler = require('./machine')
    return MachineHandler
      .find({_id: this.model.machine})
      .then(([machine]) => machine)
  }

  /**
   * Checks if provided user is owner
   * @param {UserHandler} user
   * @return {boolean}
   */
  isOwner (user) {
    const owner = this.model.populated('owner') || this.model.owner
    return user.model._id.equals(owner)
  }

  deleteBooking () {
    return this.model.remove().then(() => this)
  }

  toRestSummary () {
    return {id: this.model.id, href: `/api/bookings/${this.model.id}`}
  }

  toRest () {
    return Promise.resolve({
      id: this.model.id,
      href: `/api/bookings/${this.model.id}`,
      from: this.model.from.toISOString(),
      to: this.model.to.toISOString()
    })
  }
}

module.exports = BookingHandler
