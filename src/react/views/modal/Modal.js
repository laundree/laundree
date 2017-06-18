// @flow
import React from 'react'
import BaseModal from './BaseModal'

export type ModalProps = {
  message: string,
  actions: {label: string, className: string, action: Function}[]
}

export default class Modal extends BaseModal<ModalProps> {

  renderContent () {
    const actions = this.props.actions || []
    return <div>
      <div className='message'>
        {this.props.message}
      </div>
      <ul className='actionList'>
        {actions.map((action, i) => <li key={i}>
          <button className={action.className} onClick={action.action}>{action.label}</button>
        </li>)}
      </ul>
    </div>
  }
}
