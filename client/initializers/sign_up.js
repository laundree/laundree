/**
 * Created by budde on 22/04/16.
 */
var Initializer = require('./initializer')
var EventEmitter = require('events')
var decorators = require('../decorators')
var FormDecorator = decorators.FormDecorator

var stepEmitter = new EventEmitter()

class StepListInitializer extends Initializer {

  setup (element) {
    var list = element.querySelector('#StepList')
    if (!list) return
    stepEmitter.on('step', function (step) {
      list.setAttribute('class', '')
      list.classList.add('step' + step)
    })
  }
}

class CreateAccountInitializer extends Initializer {

  setup (element) {
    var form = element.querySelector('#CreateAccount > form')
    if (!form) return
    stepEmitter.on('step', function (step) {
      if (step === 1) return form.parentNode.removeAttribute('hidden')
      form.parentNode.setAttribute('hidden', '')
    })
    var formDecorator = new FormDecorator(form)
    formDecorator.submitFunction = () => Promise.resolve()
    var next_button = form.querySelector('button.next')
    if (!next_button) return
    next_button.addEventListener('click', () => {
//      if (form.classList.contains('invalid') || form.classList.contains('initial')) return
      stepEmitter.emit('step', 2)
    })
  }
}

class RegisterMachinesInitializer extends Initializer {

  setup (element) {
    var form = element.querySelector('#RegisterMachines > form')
    if (!form) return
    stepEmitter.on('step', function (step) {
      if (step === 2) return form.parentNode.removeAttribute('hidden')
      form.parentNode.setAttribute('hidden', '')
    })
    var formDecorator = new FormDecorator(form)
    formDecorator.submitFunction = () => Promise.resolve()
    this._setupAddMachine(formDecorator)
    var prev_button = form.querySelector('button.prev')
    if (!prev_button) return
    var next_button = form.querySelector('button.next')
    if (!next_button) return
    prev_button.addEventListener('click', () => {
      stepEmitter.emit('step', 1)
    })
    next_button.addEventListener('click', () => {
      stepEmitter.emit('step', 3)
    })
  }

  _setupAddMachine (formDecorator) {
    var form = formDecorator.element
    var ul = form.parentNode.querySelector('form > ul')
    var li = ul.firstElementChild
    if (!li) return
    var liOuterHtml = li.outerHTML
    var add = form.parentNode.querySelector('form > .add')
    if (!add) return
    var addElement = () => {
      ul.insertAdjacentHTML('beforeend', liOuterHtml)
      formDecorator.validateForm()
    }
    ul.addEventListener('click', (evt) => {
      var t = evt.target
      while (t !== ul) {
        if (!t.classList.contains('delete')) {
          t = t.parentNode
          continue
        }
        t.parentNode.parentNode.removeChild(t.parentNode)
        if (ul.childElementCount === 0) addElement()
        else formDecorator.validateForm()
        break
      }
    })
    add.addEventListener('click', addElement)
  }
}

class InviteTenantsInitializer extends Initializer {

  setup (element) {
    var form = element.querySelector('#InviteTenants')
    if (!form) return
    stepEmitter.on('step', function (step) {
      if (step === 3) return form.removeAttribute('hidden')
      form.setAttribute('hidden', '')
    })
    var formDecorator = new FormDecorator(form)
    formDecorator.submitFunction = () => Promise.resolve()
    var prev_button = form.querySelector('button.prev')
    if (!prev_button) return
    prev_button.addEventListener('click', () => {
      stepEmitter.emit('step', 2)
    })
  }
}

class SignUpInitializer extends Initializer {

  constructor (init_library) {
    super(init_library)
    init_library.registerInitializer(StepListInitializer)
    init_library.registerInitializer(CreateAccountInitializer)
    init_library.registerInitializer(RegisterMachinesInitializer)
    init_library.registerInitializer(InviteTenantsInitializer)
  }

  setup (element) {
  }
}

module.exports = SignUpInitializer
