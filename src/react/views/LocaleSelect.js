// @flow
import React from 'react'
import { DropDown, DropDownTitle, DropDownContent, DropDownCloser } from './dropdown'
import locales from '../../locales'
import type { LocaleType } from '../../locales'
import type { Location } from 'react-router'

const LocaleSelect = (props: { location: Location, locale: LocaleType }) => <DropDown className='language'>
  <DropDownTitle>
    <svg>
      <use xlinkHref='#Globe' />
    </svg>
  </DropDownTitle>
  <DropDownContent className='right'>
    <ul className='dropDownList'>
      {locales.supported.map(l => <li key={l} className={props.locale === l ? 'active' : ''}>
        <DropDownCloser>
          <a
            href={`/lang/${l}?r=${encodeURIComponent(props.location.pathname)}`}
            className='link'>{locales[l].name}</a>
        </DropDownCloser>
      </li>)}
    </ul>
  </DropDownContent>
</DropDown>

module.exports = LocaleSelect
