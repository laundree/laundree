const React = require('react')
const regex = require('../../../utils/regex')

var id = 0

function newId () {
  return id++
}

class ValidationElement extends React.Component {

  constructor (props) {
    super(props)
    this.valid = undefined
  }

  handle () {
    const valid = Boolean(this.validate())
    if (valid === this.valid) return
    this.valid = valid
    if (!this.context.validation.handler) return
    this.context.validation.handler(this.name, valid)
  }

  componentDidMount () {
    this.id = newId()
    if (!this.context.validation.handler) return
    this.context.validation.handler(this.name, false, true)
  }

  get name () {
    return `id${this.id}`
  }

  validate () {
    var value = this.props.value
    if (this.props.trim) value = value.trim()
    if (this.props.validator) return this.props.validator(value)
    if (this.props.notOneOf) return this.props.notOneOf.indexOf(value) < 0
    if (this.props.nonEmpty) return value
    if (this.props.email) return regex.email.exec(value)
    return true
  }

  componentWillReceiveProps () {
    this.handle()
  }

  render () {
    const valid = this.validate()
    const child = React.Children.only(this.props.children)
    return React.cloneElement(child, {
      className: (child.props.className || '') + (valid ? '' : ' invalid')
    })
  }
}

ValidationElement.contextTypes = {
  validation: React.PropTypes.shape({handler: React.PropTypes.func})
}

ValidationElement.propTypes = {
  children: React.PropTypes.any,
  notOneOf: React.PropTypes.arrayOf(React.PropTypes.string),
  trim: React.PropTypes.bool,
  nonEmpty: React.PropTypes.bool,
  email: React.PropTypes.bool,
  value: React.PropTypes.string.isRequired,
  validator: React.PropTypes.func
}

module.exports = ValidationElement
