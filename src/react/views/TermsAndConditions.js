// @flow
import React from 'react'
import {Redirect} from 'react-router'
import type { LocaleType } from '../../locales/index'

const TermsAndConditions = ({locale}: {locale: LocaleType}) => (<Redirect to={`https://laundree.github.io/tos/${locale}/current`}/>)

export default TermsAndConditions
