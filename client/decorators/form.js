/**
 * Created by budde on 22/04/16.
 */

var ElementDecorator = require('./element')

var utils = {validateType: require('../../utils/validate_type'), regex: require('../../utils/regex')}

var _ = require('lodash')

function boolToPromise (bool, validator) {
  if (bool) return Promise.resolve()
  var error = new Error()
  error.validation = validator
  return Promise.reject(error)
}

function validateRegEx (formDecorator, input, regex) {
  if (!regex) {
    var r = input.dataset['validateRegex']
    if (!r) throw new Error('No regex provided to validation')
    regex = new RegExp(r)
  }
  return boolToPromise(regex.exec(input.value), 'regEx')
}

function validateChecked (formDecorator, input) {
  return boolToPromise(input.checked)
}

/**
 * @type {Object.<string, function(formDecorator: FormDecorator, input: HTMLElement) : Promise.<boolean>>}
 */
var staticValidators = {}

staticValidators['checked'] = validateChecked

Object.keys(utils.regex).forEach((key) => {
  staticValidators[key] = (formDecorator, input) =>
    validateRegEx(formDecorator, input, utils.regex[key])
      .catch((err) => {
        err.validation = key
        throw err
      })
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
    this.notionElement = null
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
      if (this.element.classList.contains('invalid') ||
        this.element.classList.contains('blur') ||
        this.element.classList.contains('initial')) {
        return
      }
      this.element.classList.add('blur')
      var promise = this._submitFunction()
      if (!promise) {
        this.element.classList.remove('blur')
        return
      }
      promise
        .then((response) => {
          if (!response || !response.message) return
          this.updateNotion(FormDecorator.NOTION_TYPE_SUCCESS, response.message)
        })
        .then(() => this.element.classList.remove('blur'))
        .then(() => this.element.reset())
        .then(() => this.validateForm())
        .catch((err) => {
          this.updateNotion(FormDecorator.NOTION_TYPE_ERROR, err.message)
          this.element.classList.remove('blur')
        })
    }
  }

  _createNotionElement () {
    if (this.notionElement) return
    this.notionElement = this.element.querySelector('.notion')

    if (this.notionElement) return
    this.notionElement = document.createElement('div')
    this.notionElement.classList.add('notion')
    this.notionElement.setAttribute('hidden', 'hidden')
    this.element.insertBefore(this.notionElement, this.element.childNodes[0])
  }

  updateNotion (type, message) {
    if (!message) return
    this._createNotionElement()
    this.notionElement.setAttribute('class', `notion ${type}`)
    this.notionElement.removeAttribute('hidden')
    this.notionElement.innerText = message
  }

  /**
   * Register an validator
   * @param {string} type
   * @param {function (formDecorator:FormDecorator, element:HTMLElement) : Promise.<boolean>} validator
   */
  registerValidator (type, validator) {
    this.validators[type] = (formDecorator, element) => validator(formDecorator, element).catch((err) => {
      err.validation = type
      throw err
    })
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
      .then(() => {
        element.classList.remove('deciding')
        element.classList.remove('invalid')
      })
      .catch((err) => {
        element.classList.add('invalid')
        var validation = err.validation
        if (!validation) throw err
        validation = validation.charAt(0).toUpperCase() + validation.slice(1)
        if (!element.dataset[`validateError${validation}`]) return
        element.dataset.validateError = element.dataset[`validateError${validation}`]
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

FormDecorator.NOTION_TYPE_ERROR = 'error'
FormDecorator.NOTION_TYPE_SUCCESS = 'success'

module.exports = FormDecorator
