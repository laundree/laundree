// @flow
import React from 'react'
import { Redirect } from 'react-router'
import type { LocaleType } from '../../locales/index'
import { connect } from 'react-redux'

type TermsAndConditionsProps = { locale: LocaleType }

const TermsAndConditions = ({locale}: TermsAndConditionsProps) => (
  <Redirect to={`https://laundree.github.io/tos/${locale}/current`} />)

export default connect(({config: {locale}}): TermsAndConditionsProps => ({locale}))(TermsAndConditions)
