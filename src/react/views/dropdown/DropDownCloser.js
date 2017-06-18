// @flow
import React from 'react'
import PropTypes from 'prop-types'
import type {Children} from 'react'

export default class DropDownCloser extends React.Component<*, {children: Children}, *> {

  generateOnClick = (fn: Function) => (evt: Event) => {
    if (fn) fn(evt)
    this.context.closeDropDown()
  }

  child () {
    return React.Children.only(this.props.children)
  }

  render () {
    const child = this.child()
    return React.cloneElement(child, {onClick: this.generateOnClick(child.props.onClick)})
  }
}

DropDownCloser.contextTypes = {
  closeDropDown: PropTypes.func.isRequired
}
