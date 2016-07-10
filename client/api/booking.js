/**
 * Created by budde on 06/05/16.
 */
const rest = require('rest')
const mime = require('rest/interceptor/mime')
const errorCode = require('rest/interceptor/errorCode')
const {wrapError} = require('../utils')

const client = rest.wrap(mime).wrap(errorCode)

class BookingClientApi {

  constructor (id) {
    this.id = id
  }

  deleteBooking () {
    return client({
      path: `/api/bookings/${this.id}`,
      method: 'DELETE'
    })
      .catch(wrapError)
  }
}

module.exports = BookingClientApi
