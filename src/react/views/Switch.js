// @flow
import React from 'react'

export default class Switch extends React.Component {

  props: {
    on: boolean,
    onChange:(boolean) => void
  }

  onClick = () => this.props.onChange(!this.isOn)

  isOn () {
    return Boolean(this.props.on)
  }

  render () {
    return <div
      onClick={this.onClick}
      className={'switch ' + (this.isOn() ? 'on' : 'off')} />
  }
}
