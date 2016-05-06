/**
 * Created by budde on 22/04/16.
 */

var ElementDecorator = require('./element')
var utils = require('../../utils')
var _ = require('lodash')

function validateRegEx (formDecorator, input, regex) {
  if (!regex) {
    var r = input.dataset['validateRegex']
    if (!r) throw new Error('No regex provided to validation')
    regex = new RegExp(r)
  }
  return Promise.resolve(regex.exec(input.value))
}

function validateChecked (formDecorator, input) {
  return Promise.resolve(input.checked)
}

/**
 * @type {Object.<string, function(formDecorator: FormDecorator, input: HTMLElement) : Promise.<boolean>>}
 */
var staticValidators = {}

staticValidators['checked'] = validateChecked

Object.keys(utils.regex).forEach((key) => {
  staticValidators[key] = (formDecorator, input) => validateRegEx(formDecorator, input, utils.regex[key])
})

class FormDecorator extends ElementDecorator {

  /**
   * @param {HTMLFormElement} formElement
   */
  constructor (formElement) {
    super(formElement)
    this._submitFunction = undefined
    this._submitIsSetup = false
    this.validators = {}
    this._setupValidation()
  }

  /**
   * @param {function() : Promise} func
   */
  set submitFunction (func) {
    this._submitFunction = func
    if (this._submitIsSetup) return
    this.element.addEventListener('submit', this._createSubmitEventListener())
    this._submitIsSetup = true
  }

  _createSubmitEventListener () {
    return (evt) => {
      if (!this._submitFunction) return
      evt.preventDefault()
      this.element.classList.add('blur')
      var promise = this._submitFunction()
      if (!promise) {
        this.element.classList.remove('blur')
        return
      }
      promise
        .then(() => this.element.classList.remove('blur'))
        .catch(() => this.element.classList.remove('blur'))
    }
  }

  /**
   * Register an validator
   * @param {string} type
   * @param {function (formDecorator:FormDecorator, HTMLElement element) : Promise.<boolean>} validator
   */
  registerValidator (type, validator) {
    this.validators[type] = validator
  }

  _validateElement (element) {
    var inputs = element.querySelectorAll('input')
    element.classList.remove('initial')
    var results = []
    for (var j = 0; j < inputs.length; j++) {
      var input = inputs[j]
      var validateType = input.dataset['validateType']
      if (!validateType) {
        results[j] = Promise.resolve(true)
        continue
      }
      results[j] = utils.validateType.parse(validateType)
        .generateValidator(_.merge(staticValidators, this.validators))(this, input)
    }
    element.classList.add('deciding')
    Promise
      .all(results)
      .then((results) => results.every((d) => d))
      .then((result) => {
        element.classList.remove('deciding')
        element.classList.toggle('invalid', !result)
      })
  }

  validate () {
    this._elementsToValidate.forEach((e) => this._validateElement(e))
  }

  validateForm () {
    if (!this.element.classList.contains('validate')) return
    this._validateElement(this.element)
  }

  get _elementsToValidate () {
    var result = []
    var elementsToValidate = this.element.parentNode.querySelectorAll('.validate')
    for (var i = 0; i < elementsToValidate.length; i++) {
      result[i] = elementsToValidate[i]
    }
    return result
  }

  /**
   * @returns {Object.<string,string>}
   */
  get values () {
    var out = {}
    for (var i = 0; i < this.element.elements.length; i++) {
      var e = this.element.elements[i]
      out[e.name] = e.value
    }
    return out
  }

  _setupValidation () {
    var listener = (evt) => {
      var target = evt.target
      while (target !== this.element.parentNode) {
        if (target.classList.contains('validate')) this._validateElement(target)
        target = target.parentNode
      }
    }
    this.element.addEventListener('change', listener)
    this.element.addEventListener('input', listener)
  }
}

module.exports = FormDecorator
