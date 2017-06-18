// @flow

import React from 'react'
import DocTitle from 'react-document-title'
import { injectIntl } from 'react-intl'
export { default as Modal } from './Modal'

function elementFactory (element, property, defaults = {}): Class<React$Component<*, *, *>> {
  const Component = props => {
    const newProp = {}
    newProp[property] = props.intl.formatMessage({id: props[property]})
    const newProps = Object.assign({}, defaults, props, newProp)
    delete newProps.intl
    return React.createElement(element, newProps)
  }
  return injectIntl(Component)
}

export const DocumentTitle: Class<DocTitle> = elementFactory(DocTitle, 'title')
export const Input = elementFactory('input', 'placeholder')
export const Submit = elementFactory('input', 'value', {type: 'submit'})
export const TextArea = elementFactory('textarea', 'placeholder')
export const Label = elementFactory('label', 'data-validate-error')
