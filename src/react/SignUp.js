// @flow
import React from 'react'
import { Meta } from './intl'
import { Link } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'
import SignUpForm from './SignUpForm'
import SocialButton from './SocialButton'
import type { LocaleType } from '../locales/index'
import { connect } from 'react-redux'

const SignUp = ({locale}: { locale: LocaleType }) => (
  <div>
    <Meta title={'document-title.signup'} description={'meta.signup.description'}/>
    <FormattedMessage id='auth.signup.title' tagName='h1' />
    <Link to={'/'} id='Logo'>
      <svg>
        <use xlinkHref='#MediaLogo' />
      </svg>
    </Link>
    <div className='auth_alternatives'>
      <SocialButton type={'facebook'} signUp />
      <SocialButton type={'google'} signUp />
    </div>
    <div className='or'>
      <FormattedMessage id='general.or' />
    </div>
    <SignUpForm />
    <div className='forgot'>
      <div>
        <FormattedMessage
          id='auth.links.login'
          values={{
            link: <Link to={'/auth'}>
              <FormattedMessage id='auth.links.login.link' />
            </Link>
          }} />
      </div>
      <div>
        <FormattedMessage
          id='auth.links.forgot'
          values={{
            link: <Link
              to={'/auth/forgot'}
              className='forgot'>
              <FormattedMessage id='auth.links.forgot.link' />
            </Link>
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

export default connect(({config: {locale}}): { locale: LocaleType } => ({locale}))(SignUp)
