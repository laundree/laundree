/**
 * Created by budde on 22/04/16.
 */
var Initializer = require('./initializer')
var decorators = require('../decorators')
var UserClientApi = require('../api').UserClientApi

var FormDecorator = decorators.FormDecorator

function login (username, password) {
  var form = document.createElement('form')
  form.method = 'POST'
  form.action = '/auth/local'
  var createInput = (name, value) => {
    var input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  createInput('username', username)
  createInput('password', password)
  form.submit()
}

class CreateAccountInitializer extends Initializer {

  setup (element) {
    var form = element.querySelector('#CreateAccount > form')
    if (!form) return
    var formDecorator = new FormDecorator(form)
    var validatorCache = {}
    formDecorator.registerValidator('emailAvailable', (formDecorator, input) => {
      var value = input.value
      if (validatorCache.hasOwnProperty(value)) return validatorCache[value]
      var response = UserClientApi.userFromEmail(value).then((user) => {
        if (user === null) return
        throw new Error('Email already exists.')
      })
      validatorCache[value] = response
      return response
    })
    formDecorator.submitFunction = () => {
      var email = formDecorator.values['email']
      var password = formDecorator.values['password']
      return UserClientApi.createUser(formDecorator.values['name'], email, password).then(() => {
        login(email, password)
      })
    }
  }
}

module.exports = CreateAccountInitializer
