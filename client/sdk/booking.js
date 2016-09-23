/**
 * Created by budde on 06/05/16.
 */

const request = require('superagent')

class BookingClientSdk {

  constructor (id) {
    this.id = id
  }

  deleteBooking () {
    return request
      .delete(`/api/bookings/${this.id}`)
      .then()
  }
}

module.exports = BookingClientSdk
