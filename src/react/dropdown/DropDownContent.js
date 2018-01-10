// @flow
import React from 'react'

export default class DropDownContent extends React.Component<{className?: string, children?: *}> {
  render () {
    const props = this.props
    return (
      <div className={'dropDownContent ' + (props.className ? props.className : '')}>{props.children}</div>
    )
  }
}
