// @flow
import React from 'react'
import { DocumentTitle } from './intl'
import { Link } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'
import SignUpForm from './SignUpForm'

export default () => (
  <DocumentTitle title='document-title.signup'>
    <div>
      <FormattedMessage id='auth.signup.title' tagName='h1' />
      <Link to={'/'} id='Logo'>
        <svg>
          <use xlinkHref='#MediaLogo' />
        </svg>
      </Link>
      <div className='auth_alternatives'>
        <a href={'/auth/facebook'} className='facebook'>
          <svg>
            <use xlinkHref='#Facebook' />
          </svg>
          <FormattedMessage id='auth.signup.method.facebook' />
        </a>
        <a href={'/auth/google'} className='google'>
          <svg>
            <use xlinkHref='#GooglePlus' />
          </svg>
          <FormattedMessage id='auth.signup.method.google' />
        </a>
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
            href={'/terms-and-conditions'}
            target='_blank'>
            <FormattedMessage id='general.toc' />
          </a>,
          pp: <a href={'/privacy'} target='_blank'>
            <FormattedMessage id='general.privacy-policy' />
          </a>
        }} />
      </div>
    </div>
  </DocumentTitle>
)
