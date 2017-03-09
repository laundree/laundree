const React = require('react')
const regex = require('../../../utils/regex')

let id = 0

function newId () {
  return id++
}

class ValidationElement extends React.Component {
  constructor (props) {
    super(props)
    this.initialState = {initial: true}
    this.state = {initial: true}
  }

  handle (valid, initial = false) {
    this.context.validation.handler(this.name, Boolean(valid), initial)
  }

  componentDidMount () {
    this.id = newId()
    this.reset()
  }

  reset () {
    this.setState(this.initialState)
    this.handle(this.validate(), true)
  }

  componentWillReceiveProps (props) {
    const {sesh} = props
    const initial = sesh !== this.props.sesh
    if (initial) {
      this.setState({initial})
      return this.handle(this.validate(props), initial)
    }
    if (props.value === this.props.value && Boolean(this.validate(props)) === Boolean(this.validate(this.props))) return
    this.handle(this.validate(props), initial)
  }

  get name () {
    return `id${this.id}`
  }

  validate (props = this.props) {
    let {value} = props
    if (props.trim) value = value.trim()
    if (props.equal !== undefined) return props.equal === value
    if (props.not !== undefined) return props.not !== value
    if (props.validator) return props.validator(value)
    if (props.notOneOf) return props.notOneOf.indexOf(value) < 0
    if (props.oneOf) return props.oneOf.indexOf(value) >= 0
    if (props.nonEmpty) return value
    if (props.email) return regex.email.exec(value)
    if (props.password) return regex.password.exec(value)
    return true
  }

  render () {
    const valid = this.validate()
    if (!this.props.children) return null
    const child = React.Children.only(this.props.children)
    return React.cloneElement(child, {
      className: (child.props.className || '') + (valid ? '' : ' invalid') +
      (this.state.initial ? ' initial' : '')
    })
  }
}

ValidationElement.contextTypes = {
  validation: React.PropTypes.shape({handler: React.PropTypes.func})
}

ValidationElement.propTypes = {
  sesh: React.PropTypes.number,
  children: React.PropTypes.any,
  notOneOf: React.PropTypes.arrayOf(React.PropTypes.string),
  oneOf: React.PropTypes.arrayOf(React.PropTypes.string),
  equal: React.PropTypes.string,
  not: React.PropTypes.string,
  trim: React.PropTypes.bool,
  nonEmpty: React.PropTypes.bool,
  password: React.PropTypes.bool,
  email: React.PropTypes.bool,
  value: React.PropTypes.any.isRequired,
  validator: React.PropTypes.func
}

module.exports = ValidationElement
