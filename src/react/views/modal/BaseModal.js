// @flow

import React from 'react'
import type {Children} from 'react'

type BaseModalProps = {
  show: boolean,
  onClose: Function,
  children: Children
}

export default class BaseModal<P> extends React.Component<*, P & BaseModalProps, *> {
  escListener = (event: Event) => {
    if (!this.props.onClose) return
    if (event.keyCode !== 27) return
    this.props.onClose()
  }

  componentWillUnmount () {
    document.removeEventListener('keyup', this.escListener)
  }

  componentDidMount () {
    document.addEventListener('keyup', this.escListener)
  }

  renderContent () : ?React$Element<*> {
    return null
  }

  render () {
    if (!this.props.show) return null
    return <div className='confirmation_container'>
      <div className='confirmation_overlay' onClick={this.props.onClose}/>
      <div className='confirmation_box'>
        {this.renderContent() || this.props.children}
      </div>
    </div>
  }
}
