// @flow
import React from 'react'
import DropDownTitle from './DropDownTitle'
import DropDownContent from './DropDownContent'
import PropTypes from 'prop-types'
import type {Children} from 'react'

export default class DropDown extends React.Component<*, {className: string, children: Children}, *> {

  state = {open: false}
  onToggle = () => this.toggle()
  ref: HTMLElement

  refPuller = (r: HTMLElement) => {
    this.ref = r
  }
  clickListener = (event: Event) => {
    let target = event.target
    while (target && target.classList) {
      if (target === this.ref) return
      target = target.parentNode || null
    }
    this.close()
  }
  escListener = (event: Event) => {
    if (event.keyCode !== 27) return
    this.close()
  }

  getChildContext () {
    return {closeDropDown: () => this.close()}
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.clickListener)
    document.removeEventListener('keyup', this.escListener)
  }

  componentDidMount () {
    document.addEventListener('click', this.clickListener)
    document.addEventListener('keyup', this.escListener)
  }

  close () {
    this.setState({open: false})
  }

  toggle () {
    this.setState(({open}) => ({open: !open}))
  }

  render () {
    const children = React.Children.toArray(this.props.children)
    const title = children.find(i => i.type === DropDownTitle)
    if (!title) throw new Error('Drop-down title not provided')
    const content = children.find(i => i.type === DropDownContent)
    if (!content) throw new Error('Drop-down content not found')
    return <div
      ref={this.refPuller}
      className={'dropDown ' + (this.state.open ? 'open ' : '') + (this.props.className ? this.props.className : '')}>
      {React.cloneElement(title, {onClick: this.onToggle})}
      {this.state.open ? content : null}
    </div>
  }
}

DropDown.childContextTypes = {
  closeDropDown: PropTypes.func.isRequired
}
