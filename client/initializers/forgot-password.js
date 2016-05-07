/**
 * Created by budde on 07/05/16.
 */

var Initializer = require('./initializer')
var FormDecorator = require('../decorators').FormDecorator
var UserClientApi = require('../api').UserClientApi

class ForgotPasswordInitializer extends Initializer {

  setup (element) {
    var form = element.querySelector('#ForgotPassword')
    if (!form) return
    var decorator = new FormDecorator(form)
    decorator.submitFunction = () => {
      return UserClientApi
        .userFromEmail(decorator.values.email)
        .then((user) => {
          if (!user) throw new Error('User not found')
          return UserClientApi.startPasswordReset(user.id).then(() => ({message: 'A reset-link has been sent.'}))
        })
    }
  }
}

module.exports = ForgotPasswordInitializer
