const React = require('react')

class ValidationForm extends React.Component {

  constructor (props) {
    super(props)
    this.state = {initial: true, failed: false}
    this.initialState = {}
    this.submitHandler = (evt) => {
      if (!this.valid) {
        evt.preventDefault()
        this.setState({failed: true})
        return
      }
      if (!this.props.onSubmit) return
      this.props.onSubmit(evt)
    }
  }

  generateValidationHandler () {
    return (name, valid) => {
      this.setState((prevState) => {
        const valids = prevState.valid || this.initialState
        const obj = {}
        obj[name] = valid
        return {initial: false, valid: Object.assign({}, valids, obj)}
      })
    }
  }

  get valid () {
    const valids = this.state.valid || this.initialState
    return Object
      .keys(valids)
      .map((k) => valids[k])
      .every((v) => v)
  }

  get initial () {
    return this.state.initial
  }

  get failed () {
    return this.state.failed
  }

  getChildContext () {
    return {validation: {handler: this.generateValidationHandler()}}
  }

  get className () {
    return (this.props.className || '') + ' ' +
      (this.valid ? '' : 'invalid') + ' ' +
      (this.initial ? 'initial' : '') + ' ' +
      (this.failed ? 'failed' : '')
  }

  render () {
    return <form
      onSubmit={this.submitHandler}
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
  onSubmit: React.PropTypes.func,
  className: React.PropTypes.string,
  id: React.PropTypes.string,
  method: React.PropTypes.string,
  action: React.PropTypes.string,
  children: React.PropTypes.any
}

module.exports = ValidationForm
