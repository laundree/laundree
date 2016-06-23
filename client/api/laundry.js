/**
 * Created by budde on 06/05/16.
 */
const rest = require('rest')
const mime = require('rest/interceptor/mime')
const errorCode = require('rest/interceptor/errorCode')
const {wrapError} = require('../utils')

const client = rest.wrap(mime).wrap(errorCode)

class LaundryClientApi {

  constructor (id) {
    this.id = id
  }

  static createLaundry (name) {
    return client({
      path: '/api/laundries',
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      entity: {name}
    })
      .catch(wrapError)
      .then((response) => {
        const entity = response.entity
        if (!entity) return null
        return entity
      })
  }
}

module.exports = LaundryClientApi
