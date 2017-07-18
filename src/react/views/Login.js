// @flow
import React from 'react'
import { DocumentTitle, Input, Submit, Label } from './intl'
import { Link } from 'react-router-dom'
import { ValidationForm, ValidationElement } from './validation'
import ValueUpdater from './helpers/ValueUpdater'
import { FormattedMessage } from 'react-intl'
import type { Flash } from 'laundree-sdk/lib/redux'
import { WebAuth } from 'auth0-js'

type LoginProps = {
  to?: string,
  flash: Flash[]
}

type LoginValues = {
  email: string,
  password: string
}

export default class Login extends ValueUpdater<LoginValues, LoginProps, {}> {
  webAuth: WebAuth

  initialState () {
    return {}
  }

  initialValues () {
    return {email: '', password: ''}
  }

  handleNotion () {
    if (!this.props.flash.length) return null
    const {type, message} = this.props.flash[0]
    return <div className={`notion ${type}`}>
      <FormattedMessage
        id={message}
        values={{
          link: <Link to='/auth/verification'><FormattedMessage id='auth.error.not-verified.link'/></Link>
        }}/>
    </div>
  }

  query () {
    return this.props.to ? `?to=${encodeURIComponent(this.props.to)}` : ''
  }

  componentDidMount () {
    this.webAuth = new WebAuth({
      domain: 'laundree-test.eu.auth0.com',
      clientID: 'i143cn6TgLjdfpAWc7tRiPFGB1g9ns5Z',
      redirectUri: 'http://localhost:3000/auth',
      audience: 'https://laundree.io/api',
      responseType: 'token'
    })
    this.webAuth.parseHash((err, authResult) => {
      if (authResult) {
        // Save the tokens from the authResult in local storage or a cookie
        window.localStorage.setItem('access_token', authResult.accessToken)
        window.localStorage.setItem('id_token', authResult.idToken)
      } else if (err) {
        // Handle errors
        console.log(err)
      }
    })
  }
  loginFacebook = () => this.webAuth.authorize({connection: 'facebook'})

  loginGoogle = () => this.webAuth.authorize({connection: 'google-oauth2'})

  loginUsernamePassword = (evt: MouseEvent) => {
    evt.preventDefault()
    this.webAuth.redirect.loginWithCredentials({
      connection: 'Username-Password-Authentication',
      username: this.state.values.email,
      password: this.state.values.password,
      scope: 'openid'
    }, (err, data) => {
      console.log(err, data)
    })
  }

  render () {
    const query = this.query()
    return <DocumentTitle title='document-title.login'>
      <div>
        <FormattedMessage tagName='h1' id='auth.login.title'/>
        <Link to='/' id='Logo'>
          <svg>
            <use xlinkHref='#MediaLogo'/>
          </svg>
        </Link>
        <div className='auth_alternatives'>
          <span onClick={this.loginFacebook} className='facebook'>
            <svg>
              <use xlinkHref='#Facebook'/>
            </svg>
            <FormattedMessage id='auth.login.method.facebook'/>
          </span>
          <span onClick={this.loginGoogle} className='google'>
            <svg>
              <use xlinkHref='#GooglePlus'/>
            </svg>
            <FormattedMessage id='auth.login.method.google'/>
          </span>
        </div>
        <div className='or'>
          <FormattedMessage id='general.or'/>
        </div>
        <ValidationForm id='SignIn' method='post' action={'/auth/local' + query} onSubmit={this.loginUsernamePassword}>
          {this.handleNotion()}
          <ValidationElement email trim value={this.state.values.email || ''}>
            <Label
              data-validate-error='auth.error.invalid-email'>
              <Input
                type='text'
                name='username'
                placeholder='general.email-address'
                value={this.state.values.email || ''}
                onChange={this.generateValueEventUpdater(email => ({email}))}/>
            </Label>
          </ValidationElement>
          <ValidationElement
            value={this.state.values.password || ''}
            nonEmpty trim>
            <Label
              data-validate-error='auth.error.no-password'>
              <Input
                type='password' name='password' placeholder='general.password'
                value={this.state.values.password || ''}
                onChange={this.generateValueEventUpdater(password => ({password}))}/>
            </Label>
          </ValidationElement>
          <div className='buttons'>
            <Submit value='general.login'/>
          </div>
          <div className='forgot'>
            <div>
              <FormattedMessage
                id='auth.links.forgot'
                values={{
                  link: <Link
                    to='/auth/forgot'
                    className='forgot'>
                    <FormattedMessage id='auth.links.forgot.link'/>
                  </Link>
                }}/>
            </div>
            <div>
              <FormattedMessage
                id='auth.links.signup'
                values={{
                  link: <Link
                    to='/auth/sign-up'
                    className='forgot'>
                    <FormattedMessage id='auth.links.signup.link'/>
                  </Link>
                }}/>
            </div>
          </div>
        </ValidationForm>
        <div className='notice'>
          <FormattedMessage id='auth.login.notice' values={{
            toc: <a
              href='/terms-and-conditions'
              target='_blank'>
              <FormattedMessage id='general.toc'/>
            </a>,
            pp: <a href='/privacy' target='_blank'>
              <FormattedMessage id='general.privacy-policy'/>
            </a>
          }}/>
        </div>
      </div>
    </DocumentTitle>
  }
}

