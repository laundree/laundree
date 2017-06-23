// @flow
import React from 'react'
import type {Children} from 'react'

export default class DropDownTitle extends React.Component<*, {onClick: Function, children: Children}, *> {
  render () {
    const props = this.props
    return (
      <div className='dropDownTitle' onClick={props.onClick}>{props.children}</div>
    )
  }
}
