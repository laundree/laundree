// @flow

import * as React from 'react'
import DocTitle from 'react-document-title'
import { injectIntl } from 'react-intl'

export { default as Modal } from './Modal'

function elementFactory<PP: 'title' | 'placeholder' | 'value' | 'data-validate-error', P: {[PP]: string}> (element, property: PP, defaults = {}): React$ComponentType<*> {
  const Component = (props: P & { intl: $npm$ReactIntl$IntlShape }) => {
    const newProp = {}
    newProp[property] = props.intl.formatMessage({id: props[property]})
    const newProps = Object.assign({}, defaults, props, newProp)
    delete newProps.intl
    return React.createElement(element, newProps)
  }
  return injectIntl(Component)
}

export const DocumentTitle: React.ComponentType<{ title: string }> = elementFactory(DocTitle, 'title')
export const Input: React.ComponentType<{ 'placeholder': string }> = elementFactory('input', 'placeholder')
export const Submit: React.ComponentType<{ 'value': string }> = elementFactory('input', 'value', {type: 'submit'})
export const TextArea: React.ComponentType<{ 'placeholder': string }> = elementFactory('textarea', 'placeholder')
export const Label: React.ComponentType<{ 'data-validate-error': string }> = elementFactory('label', 'data-validate-error')
