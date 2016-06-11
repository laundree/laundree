const React = require('react')

class ValidationForm extends React.Component {

  constructor (props) {
    super(props)
    this.state = {valid: {}}
  }

  generateValidationHandler () {
    return (name, valid) => {
      this.setState((prevState) => {
        const obj = {}
        obj[name] = valid
        return Object.assign({}, prevState, obj)
      })
    }
  }

  get valid () {
    return Object.values.every((v) => v)
  }

  getChildContext () {
    return {validation: {handler: this.generateValidationHandler()}}
  }

  render () {
    return <form className={(this.props.className || '') + ' ' + (this.valid ? '' : 'invalid')}>
      {this.props.children}
    </form>
  }
}

ValidationForm.childContextTypes = {
  validation: {handler: React.PropTypes.func}
}

ValidationForm.propTypes = {
  className: React.PropTypes.string,
  children: React.PropTypes.any
}

module.exports = ValidationForm
