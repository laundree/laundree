/**
 * Created by budde on 06/05/16.
 */
const request = require('superagent')

class MachineClientApi {

  constructor (id) {
    this.id = id
  }

  deleteMachine () {
    return request
      .delete(`/api/machines/${this.id}`)
      .then()
  }

  /**
   * Update machine
   * @param {{name:string=, type: string=}} params
   */
  updateMachine (params) {
    return request
      .put(`/api/machines/${this.id}`)
      .send(params)
      .then()
  }

  /**
   * Create a booking
   * @param {Date} from
   * @param {Date} to
   */
  createBooking (from, to) {
    return request
      .post(`/api/machines/${this.id}/bookings`)
      .send({from: from.toISOString(), to: to.toISOString()})
      .then()
  }
}

module.exports = MachineClientApi
