// @flow
import React from 'react'

export default class DropDownTitle extends React.Component<{onClick?: Function, children?: *}, *> {
  render () {
    const props = this.props
    return (
      <div className='dropDownTitle' onClick={props.onClick}>{props.children}</div>
    )
  }
}
