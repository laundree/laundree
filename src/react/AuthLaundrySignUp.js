// @flow

import { Meta } from './intl/index'
import * as React from 'react'
import { FormattedMessage } from 'react-intl'
import type { Match, Location } from 'react-router'
import qs from 'querystring'
import SignUpForm from './SignUpForm'
import SocialButton from './SocialButton'
import { Link } from 'react-router-dom'
import { signUpStore } from '../client/store'
import { connect } from 'react-redux'
import type { LocaleType } from '../locales/index'

const AuthLaundrySignUp = ({match, location, locale}: { locale: LocaleType, match: Match, location: Location }) => {
  const {laundryId, key} = match.params
  if (!laundryId || !key) {
    return null
  }
  const {laundryName} = qs.parse(location.search && location.search.substr(1))
  return (
    <div>
      <Meta title={'document-title.signup'} description={'meta.signup.description'}/>
      {laundryName
        ? (
          <FormattedMessage tagName='h1' id='auth.laundry.signup.title' values={{
            laundryName: <i>{laundryName}</i>
          }} />
        )
        : (
          <FormattedMessage tagName='h1' id='auth.laundry.signup.title.short' />
        )
      }
      <div className='auth_alternatives'>
        <SocialButton signUp type={'facebook'} qs={{mode: 'laundry', laundryId, key}} />
        <SocialButton signUp type={'google'} qs={{mode: 'laundry', laundryId, key}} />
      </div>
      <div className='or'>
        <FormattedMessage id='general.or' />
      </div>
      <SignUpForm onSignUp={({id: userId}) => signUpStore.set({userId, laundryId, key})} />
      <div className='forgot'>
        <div>
          <FormattedMessage
            id='auth.links.login'
            values={{
              link: (
                <Link to={`/auth/laundries/${laundryId}/${key}/login${location.search}`}>
                  <FormattedMessage id='auth.links.login.link' />
                </Link>)
            }} />
        </div>
      </div>
      <div className='notice'>
        <FormattedMessage id='auth.signup.notice' values={{
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

export default connect(({config: {locale}}): { locale: LocaleType } => ({locale}))(AuthLaundrySignUp)
