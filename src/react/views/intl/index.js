// @flow

import * as React from 'react'
import { injectIntl } from 'react-intl'
import { Helmet } from 'react-helmet'
import { toLocale, toTerritory } from '../../../locales/index'

export { default as Modal } from './Modal'

function elementFactory<PP: 'title' | 'placeholder' | 'value' | 'data-validate-error', P: { [PP]: string }> (element, property: PP, defaults = {}): React$ComponentType<*> {
  const Component = (props: P & { intl: $npm$ReactIntl$IntlShape }) => {
    const newProp = {}
    newProp[property] = props.intl.formatMessage({id: props[property]})
    const newProps = Object.assign({}, defaults, props, newProp)
    delete newProps.intl
    return React.createElement(element, newProps)
  }
  return injectIntl(Component)
}

export const Meta: React.ComponentType<{ title?: string, description?: string }> = injectIntl(({title, description, intl}: { title?: string, description?: string, intl: $npm$ReactIntl$IntlShape }) => {
  const t = title && intl.formatMessage({id: title})
  const d = description && intl.formatMessage({id: description})
  return (
    <Helmet>
      {t ? <title>{t}</title> : null}
      {t ? <meta property='og:title' content={t} /> : null}
      {d ? <meta property='description' content={d} /> : null }
      {d ? <meta property='og:description' content={d} /> : null }
      <meta property='og:logo' content={'https://laundree.io/images/small-logo.png'} />
      <meta property='og:locale' content={toTerritory(toLocale(intl.locale, 'en'))} />
    </Helmet>)
})

export const Input: React.ComponentType<{ 'placeholder': string }> = elementFactory('input', 'placeholder')
export const Submit: React.ComponentType<{ 'value': string }> = elementFactory('input', 'value', {type: 'submit'})
export const TextArea: React.ComponentType<{ 'placeholder': string }> = elementFactory('textarea', 'placeholder')
export const Label: React.ComponentType<{ 'data-validate-error': string }> = elementFactory('label', 'data-validate-error')
