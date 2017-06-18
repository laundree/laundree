// @flow
import React from 'react'
import type {Children} from 'react'

export default class DropDownContent extends React.Component<*, {className: string, children: Children}, *> {
  render () {
    const props = this.props
    return (
      <div className={'dropDownContent ' + (props.className ? props.className : '')}>{props.children}</div>
    )
  }
}
