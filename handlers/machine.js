/**
 * Created by budde on 09/06/16.
 */

const Handler = require('./handler')
const {MachineModel} = require('../models')
const BookingHandler = require('./booking')
class MachineHandler extends Handler {

  static find (filter, limit) {
    return this._find(MachineModel, MachineHandler, filter, limit)
  }

  static findFromId (id) {
    return this._findFromId(MachineModel, MachineHandler, id)
  }

  /**
   * Create a new machine
   * @param {LaundryHandler} laundry
   * @param {string} name
   * @returns {Promise.<MachineHandler>}
   */
  static _createMachine (laundry, name) {
    const model = new MachineModel({laundry: laundry.model._id, name: name})
    return model.save().then((model) => new MachineHandler(model))
  }

  /**
   * Create a new booking
   * @param {UserHandler} owner
   * @param {Date} from
   * @param {Date} to
   * @return {Promise.<BookingHandler>}
   */
  createBooking (owner, from, to) {
    return BookingHandler._createBooking(this, owner, from, to)
  }

  fetchLaundry () {
    const LaundryHandler = require('./laundry')
    return LaundryHandler.find({_id: this.model.laundry}).then(([laundry]) => laundry)
  }

  _deleteMachine () {
    return BookingHandler
      .find({machine: this.model._id})
      .then((bookings) => Promise
        .all(bookings.map((booking) => booking.deleteBooking())))
      .then(() => this.model.remove())
      .then(() => this)
  }

  toRestSummary () {
    return {name: this.model.name, href: `/machines/${this.model.id}`, id: this.model.id}
  }

  toRest () {
    return Promise.resolve({name: this.model.name, href: `/machines/${this.model.id}`, id: this.model.id})
  }

}

module.exports = MachineHandler
