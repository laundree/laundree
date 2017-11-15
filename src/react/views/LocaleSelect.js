// @flow
import React from 'react'
import { DropDown, DropDownTitle, DropDownContent, DropDownCloser } from './dropdown'
import * as locales from '../../locales'
import type { Location } from 'react-router'

const LocaleSelect = (props: { location: Location }) => {
  const locale = locales.localeFromLocation(props.location)
  return (
    <DropDown className='language'>
      <DropDownTitle>
        <svg>
          <use xlinkHref='#Globe'/>
        </svg>
      </DropDownTitle>
      <DropDownContent className='right'>
        <ul className='dropDownList'>
          {locales.supported.map(l => <li key={l} className={locale === l ? 'active' : ''}>
            <DropDownCloser>
              <a
                href={`/${l}${props.location.pathname.substr(3)}`}
                className='link'>{locales.names[l]}</a>
            </DropDownCloser>
          </li>)}
        </ul>
      </DropDownContent>
    </DropDown>
  )
}

export default LocaleSelect
