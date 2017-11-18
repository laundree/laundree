// @flow
import React from 'react'
import { DropDown, DropDownTitle, DropDownContent, DropDownCloser } from './dropdown'
import * as locales from '../../locales'
import { Route } from 'react-router'
import type { LocaleType } from '../../locales'
import { connect } from 'react-redux'
import type { StateAddendum } from './types'

type LocaleSelectType = { locale: LocaleType }

const LocaleSelect = ({locale}: LocaleSelectType) => {
  return (
    <DropDown className='language'>
      <DropDownTitle>
        <svg>
          <use xlinkHref='#Globe' />
        </svg>
      </DropDownTitle>
      <DropDownContent className='right'>
        <Route render={({location}) => (
          <ul className='dropDownList'>
            {locales.supported.map(l => (
              <li key={l} className={locale === l ? 'active' : ''}>
                <DropDownCloser>
                  <a
                    href={`/${l}${location.pathname}${location.search}`}
                    className='link'>{locales.names[l]}</a>
                </DropDownCloser>
              </li>))}
          </ul>
        )} />
      </DropDownContent>
    </DropDown>
  )
}

export default connect(({config: {locale}}: StateAddendum): LocaleSelectType => ({
  locale
}))(LocaleSelect)
