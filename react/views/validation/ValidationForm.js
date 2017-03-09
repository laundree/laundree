const React = require('react')

class ValidationForm extends React.Component {
  constructor (props) {
    super(props)
    this.initialState = {initial: true, failed: false, valid: {}}
    this.state = this.initialState
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

  componentWillReceiveProps ({sesh}) {
    if (sesh === this.props.sesh) return
    this.setState(this.initialState)
  }

  generateValidationHandler () {
    return (name, valid, initial) => {
      this.setState((prevState) => {
        const valids = prevState.valid
        const obj = {}
        obj[name] = valid
        const resultObj = {valid: Object.assign({}, valids, obj)}
        if (initial) return Object.assign({}, resultObj)
        return Object.assign({initial: false}, resultObj)
      })
    }
  }

  get valid () {
    const valids = this.state.valid
    return Object
      .keys(valids)
      .map((k) => valids[k])
      .every((v) => v)
  }

  get initial () {
    return this.props.initial || this.state.initial
  }

  get failed () {
    return this.state.failed
  }

  getChildContext () {
    return {validation: {handler: this.generateValidationHandler()}}
  }

  get className () {
    return (this.props.className || '') +
      (this.valid ? '' : ' invalid') +
      (this.initial ? ' initial' : '') +
      (this.failed ? ' failed' : '')
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
  sesh: React.PropTypes.number,
  initial: React.PropTypes.bool,
  onSubmit: React.PropTypes.func,
  className: React.PropTypes.string,
  id: React.PropTypes.string,
  method: React.PropTypes.string,
  action: React.PropTypes.string,
  children: React.PropTypes.any
}

module.exports = ValidationForm
