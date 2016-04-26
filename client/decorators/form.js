/**
 * Created by budde on 22/04/16.
 */

var ElementDecorator = require('./element')
var utils = require('../../utils')

function validateUnique (root, input) {
  var name = input.name
  if (!name) return true
  var siblings = root.querySelectorAll(`input[name=${name}]`)
  for (let k = 0; k < siblings.length; k++) {
    var sibling = siblings[k]
    if (sibling === input) continue
    if (sibling.value !== input.value) continue
    return false
  }
  return true
}

function validateRegEx (type, input) {
  var regex
  switch (type) {
    case 'non-empty':
      regex = utils.regex.non_empty
      break
    case 'email':
      regex = utils.regex.email
      break
    case 'regex':
      var r = input.dataset['validateRegex']
      if (!r) throw new Error('No regex provided to validation')
      regex = new RegExp(r)
      break
    case 'password':
      regex = utils.regex.password
      break
    default:
      regex = /.*/
  }
  return regex.exec(input.value)
}

function validateChecked (input) {
  return input.checked
}

class FormDecorator extends ElementDecorator {

  /**
   * @param {HTMLFormElement} formElement
   */
  constructor (formElement) {
    super(formElement)
    this._submitFunction = undefined
    this._submitIsSetup = false
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
      this._submitFunction()
        .then(() => this.element.classList.remove('blur'))
        .catch(() => this.element.classList.remove('blur'))
    }
  }

  _validateElement (element) {
    var inputs = element.querySelectorAll('input')
    element.classList.remove('initial')
    var results = []
    for (var j = 0; j < inputs.length; j++) {
      var input = inputs[j]
      var validateType = input.dataset['validateType']
      results[j] = true
      if (!validateType) {
        continue
      }
      validateType.split(' ').forEach((validateType) => {
        if (!results[j] || !validateType) return
        if (validateType === 'checked') {
          results[j] = validateChecked(input)
          return
        }
        if (validateType === 'unique') {
          results[j] = validateUnique(this.element, input)
          return
        }
        results[j] = validateRegEx(validateType, input)
      })
    }
    if (results.every((d) => d)) element.classList.remove('invalid')
    else element.classList.add('invalid')
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
