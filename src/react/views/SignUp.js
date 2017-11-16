// @flow
import React from 'react'
import { DocumentTitle } from './intl'
import { Link } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'
import SignUpForm from './SignUpForm'

class SignUp extends React.Component<{to: string}> {

  query () {
    return this.props.to ? `?to=${encodeURIComponent(this.props.to)}` : ''
  }

  render () {
    return <DocumentTitle title='document-title.signup'>
      <div>
        <FormattedMessage id='auth.signup.title' tagName='h1' />
        <Link to={'/'} id='Logo'>
          <svg>
            <use xlinkHref='#MediaLogo' />
          </svg>
        </Link>
        <div className='auth_alternatives'>
          <a href={`/auth/facebook${this.query()}`} className='facebook'>
            <svg>
              <use xlinkHref='#Facebook' />
            </svg>
            <FormattedMessage id='auth.signup.method.facebook' />
          </a>
          <a href={`/auth/google${this.query()}`} className='google'>
            <svg>
              <use xlinkHref='#GooglePlus' />
            </svg>
            <FormattedMessage id='auth.signup.method.google' />
          </a>
        </div>
        <div className='or'>
          <FormattedMessage id='general.or' />
        </div>
        <SignUpForm/>
        <div className='forgot'>
          <div>
            <FormattedMessage
              id='auth.links.login'
              values={{
                link: <Link to={`/auth${this.query()}`}>
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
  }
}

export default SignUp
