// @flow
import daLocale from 'react-intl/locale-data/da'
import enLocale from 'react-intl/locale-data/en'
import { addLocaleData } from 'react-intl'
import enData from './en.json'
import dadata from './da.json'

addLocaleData(daLocale.concat(enLocale))

export const en = enData
export const da = Object.assign({}, en, dadata)

export type LocaleType = 'en' | 'da'

export const supported: LocaleType[] = ['en', 'da']

export function toLocale<A> (locale: A, def: LocaleType): LocaleType {
  switch (locale) {
    case 'en':
    case 'da':
      return locale
    default:
      return def
  }
}
