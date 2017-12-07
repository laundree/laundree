// @flow

import * as React from 'react'
import { FormattedMessage } from 'react-intl'
import type { Match, Location } from 'react-router'
import qs from 'querystring'
import SocialButton from './SocialButton'
import { Link } from 'react-router-dom'
import LoginForm from './LoginForm'
import { connect } from 'react-redux'
import type { LocaleType } from '../locales/index'
import { Meta } from './intl/index'

const AuthLaundryLogin = ({match, location, locale}: { locale: LocaleType, match: Match, location: Location }) => {
  const {laundryId, key} = match.params
  if (!laundryId || !key) {
    return null
  }
  const {laundryName} = qs.parse(location.search && location.search.substr(1))
  return (
    <div>
      <Meta title={'document-title.login'} description={'meta.login.description'}/>
      {laundryName
        ? (
          <FormattedMessage tagName='h1' id='auth.laundry.login.title' values={{
            laundryName: <i>{laundryName}</i>
          }} />
        )
        : (
          <FormattedMessage tagName='h1' id='auth.laundry.login.title.short' />
        )
      }
      <div className='auth_alternatives'>
        <SocialButton type={'facebook'} qs={{mode: 'laundry', laundryId, key}} />
        <SocialButton type={'google'} qs={{mode: 'laundry', laundryId, key}} />
      </div>
      <div className='or'>
        <FormattedMessage id='general.or' />
      </div>
      <LoginForm qs={{mode: 'laundry', laundryId, key}} />
      <div className='forgot'>
        <div>
          <FormattedMessage
            id='auth.links.signup'
            values={{
              link: <Link
                to={`/auth/laundries/${laundryId}/${key}${location.search}`}
                className='forgot'>
                <FormattedMessage id='auth.links.signup.link' />
              </Link>
            }} />
        </div>
      </div>
      <div className='notice'>
        <FormattedMessage id='auth.login.notice' values={{
          toc: <a
            href={`/${locale}/terms-and-conditions`}
            target='_blank'>
            <FormattedMessage id='general.toc' />
          </a>,
          pp: <a href={`/${locale}/privacy`} target='_blank'>
            <FormattedMessage id='general.privacy-policy' />
          </a>
        }} />
      </div>
    </div>
  )
}

export default connect(({config: {locale}}): { locale: LocaleType } => ({locale}))(AuthLaundryLogin)
