/**
 * Created by budde on 07/05/16.
 */

var Initializer = require('./initializer')
var FormDecorator = require('../decorators').FormDecorator
var UserClientApi = require('../api').UserClientApi

class ResetPasswordInitializer extends Initializer {

  setup (element) {
    var form = element.querySelector('#ResetPassword')
    if (!form) return
    var decorator = new FormDecorator(form)
    decorator.submitFunction = () => UserClientApi
      .resetPassword(decorator.values.user, decorator.values.token, decorator.values.password)
      .then(() => {
        window.location = '/auth'
      })
  }
}

module.exports = ResetPasswordInitializer
