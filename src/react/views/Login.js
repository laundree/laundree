// @flow
import React from 'react'
import { Meta } from './intl'
import { Link } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'
import LoginForm from './LoginForm'
import SocialButton from './SocialButton'
import type { LocaleType } from '../../locales/index'
import { connect } from 'react-redux'

const Login = ({locale}: { locale: LocaleType }) => (
  <div>
    <Meta title={'document-title.login'} description={'meta.login.description'}/>
    <FormattedMessage tagName='h1' id='auth.login.title' />
    <Link to={'/'} id='Logo'>
      <svg>
        <use xlinkHref='#MediaLogo' />
      </svg>
    </Link>
    <div className='auth_alternatives'>
      <SocialButton type={'facebook'} />
      <SocialButton type={'google'} />
    </div>
    <div className='or'>
      <FormattedMessage id='general.or' />
    </div>
    <LoginForm />
    <div className='forgot'>
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
      <div>
        <FormattedMessage
          id='auth.links.signup'
          values={{
            link: <Link
              to={'/auth/sign-up'}
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

export default connect(({config: {locale}}): { locale: LocaleType } => ({locale}))(Login)
