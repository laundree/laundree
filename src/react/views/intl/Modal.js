// @flow

import React from 'react'
import { Modal } from '../modal'
import type { ModalProps } from '../modal/Modal'

import { injectIntl } from 'react-intl'

type ModalIntlProps = {
  intl: {
    formatMessage: Function
  }
}

class ModalIntl extends React.Component<*, ModalIntlProps & ModalProps, *> {
  render () {
    const props = this.props
    const newProps = {
      message: props.intl.formatMessage({id: props.message}),
      actions: props.actions.map(p => Object.assign({}, p, {label: props.intl.formatMessage({id: p.label})}))
    }
    return React.createElement(Modal, Object.assign({}, props, newProps))
  }

}

export default injectIntl(ModalIntl)
