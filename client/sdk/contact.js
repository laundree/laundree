/**
 * Created by budde on 23/09/16.
 */

const request = require('superagent')

class ContactClientSdk {

  static contact ({name, email, subject, message}) {
    return request
      .post(`/api/contact`)
      .send({name, email, subject, message})
      .then()
  }
}

module.exports = ContactClientSdk
