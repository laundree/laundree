const React = require('react')

class ValidationForm extends React.Component {

  constructor (props) {
    super(props)
    this.state = {valid: {}, initial: true}
  }

  generateValidationHandler () {
    return (name, valid, initial) => {
      this.setState((prevState) => {
        const obj = {}
        obj[name] = valid
        return {initial: prevState.initial && initial, valid: Object.assign({}, prevState.valid, obj)}
      })
    }
  }

  get valid () {
    return Object
      .keys(this.state.valid)
      .map((k) => this.state.valid[k])
      .every((v) => v)
  }

  get initial () {
    return this.state.initial
  }

  getChildContext () {
    return {validation: {handler: this.generateValidationHandler()}}
  }

  get className () {
    return (this.props.className || '') + ' ' +
      (this.valid ? '' : 'invalid') + ' ' +
      (this.initial ? 'initial' : '')
  }

  render () {
    return <form
      id={this.props.id}
      action={this.props.action}
      method={this.props.method}
      className={this.className}>
      {this.props.children}
    </form>
  }
}

ValidationForm.childContextTypes = {
  validation: React.PropTypes.shape({handler: React.PropTypes.func})
}

ValidationForm.propTypes = {
  className: React.PropTypes.string,
  id: React.PropTypes.string,
  method: React.PropTypes.string,
  action: React.PropTypes.string,
  children: React.PropTypes.any
}

module.exports = ValidationForm
