// @flow

import React from 'react'
import { Modal } from '../modal/index'
import type { ModalProps } from '../modal/Modal'

import { injectIntl } from 'react-intl'

type ModalIntlProps = ModalProps & {
  intl: $npm$ReactIntl$IntlShape
}

const ModalIntl = (props: ModalIntlProps) => {
  const newProps = {
    message: props.intl.formatMessage({id: props.message}),
    actions: props.actions.map(p => Object.assign({}, p, {label: props.intl.formatMessage({id: p.label})}))
  }
  return React.createElement(Modal, Object.assign({}, props, newProps))
}

export default injectIntl(ModalIntl)
