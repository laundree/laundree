/**
 * Created by budde on 19/02/2017.
 */
const React = require('react')

class Switch extends React.Component {
  constructor (props) {
    super(props)
    this.onClick = () => this.props.onChange(!this.isOn)
  }

  get isOn () {
    return Boolean(this.props.on)
  }

  render () {
    return <div
      onClick={this.onClick}
      className={'switch ' + (this.isOn ? 'on' : 'off')} />
  }
}

Switch.propTypes = {
  on: React.PropTypes.bool,
  onChange: React.PropTypes.func.isRequired
}

module.exports = Switch
