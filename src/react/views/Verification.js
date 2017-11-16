// @flow
import React from 'react'
import { Link } from 'react-router-dom'
import { ValidationForm, ValidationElement } from './validation'
import ValueUpdater from './helpers/ValueUpdater'
import sdk from '../../client/sdk'
import { Label, Input, Submit, DocumentTitle } from './intl'
import { FormattedMessage } from 'react-intl'
import type { LocaleType } from '../../locales/index'

type VerificationValues = { email: string }

export default class Verification extends ValueUpdater<VerificationValues, { locale: LocaleType }, { loading: boolean }> {

  submitHandler = async (evt: Event) => {
    this.setState({loading: true})
    evt.preventDefault()
    try {
      await sdk.api.user.startEmailVerification({email: this.state.values.email, locale: this.props.locale})
      this.reset({
        loading: false,
        notion: {message: <FormattedMessage id='auth.verification.success' />, success: true}
      })
    } catch (err) {
      this.setState({
        loading: false,
        notion: {message: <FormattedMessage id='auth.verification.error' />, success: false}
      })
    }
  }

  initialValues () {
    return {email: ''}
  }

  initialState () {
    return {loading: false}
  }

  render () {
    return <DocumentTitle title='document-title.resend-verification'>
      <div>
        <FormattedMessage id='auth.verification.title' tagName='h1' />
        <Link to={'/'} id='Logo'>
          <svg>
            <use xlinkHref='#MediaLogo' />
          </svg>
        </Link>
        <ValidationForm
          sesh={this.state.sesh}
          className={this.state.loading ? 'blur' : ''}
          onSubmit={this.submitHandler}
          id='ForgotPassword'>
          {this.renderNotion()}
          <ValidationElement
            email
            trim
            sesh={this.state.sesh}
            value={this.state.values.email}>
            <Label
              data-validate-error='auth.error.no-email'>
              <Input
                onChange={this.generateValueEventUpdater(email => ({email}))}
                value={this.state.values.email}
                type='text' name='email'
                placeholder='general.email-address'
                data-validate-type='email' />
            </Label>
          </ValidationElement>
          <div className='buttons'>
            <Submit value='general.send-again' />
          </div>
          <div className='forgot'>
            <div>
              <FormattedMessage
                id='auth.links.login2'
                values={{
                  link: (
                    <Link to={'/auth'}>
                      <FormattedMessage id='auth.links.login2.link' />
                    </Link>)
                }} />
            </div>
            <div>
              <FormattedMessage
                id='auth.links.signup'
                values={{
                  link: (
                    <Link
                      to={'/auth/sign-up'}
                      className='forgot'>
                      <FormattedMessage id='auth.links.signup.link' />
                    </Link>)
                }} />
            </div>
          </div>
        </ValidationForm>
      </div>
    </DocumentTitle>
  }
}

