/**
 * Created by budde on 06/05/16.
 */
const rest = require('rest')
const mime = require('rest/interceptor/mime')
const errorCode = require('rest/interceptor/errorCode')
const {wrapError} = require('../utils')

const client = rest.wrap(mime).wrap(errorCode)

class MachineClientApi {

  constructor (id) {
    this.id = id
  }

  deleteMachine () {
    return client({
      path: `/api/machines/${this.id}`,
      method: 'DELETE'
    })
      .catch(wrapError)
  }

  /**
   * Update machine
   * @param {{name:string=, type: string=}} params
   */
  updateMachine (params) {
    return client({
      path: `/api/machines/${this.id}`,
      headers: {'Content-Type': 'application/json'},
      method: 'PUT',
      entity: params
    })
      .catch(wrapError)
  }
}

module.exports = MachineClientApi
