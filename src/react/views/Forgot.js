// @flow
import React from 'react'
import { DocumentTitle, Input, Label, Submit } from './intl'
import { Link } from 'react-router-dom'
import { ValidationForm, ValidationElement } from './validation'
import ValueUpdater from './helpers/ValueUpdater'
import sdk from '../../client/sdk'
import { FormattedMessage } from 'react-intl'

type ForgotValues = { email: string }
type ForgotProps = {}
type ForgotState = { loading: boolean }

class Forgot extends ValueUpdater<ForgotValues, ForgotProps, ForgotState> {

  initialState () {
    return {loading: false}
  }

  initialValues () {
    return {email: ''}
  }

  submitHandler = (evt: Event) => {
    this.setState({loading: true})
    evt.preventDefault()
    return sdk.api.user.forgotPassword(this.state.values.email.toLowerCase())
      .then(
        () =>
          this.reset({
            loading: false,
            notion: {
              message: <FormattedMessage id='auth.forgot.success'/>,
              success: true
            }
          }),
        () => this.setState({
          loading: false,
          notion: {
            message: <FormattedMessage id='auth.forgot.error'/>,
            success: false
          }
        }))
  }

  render () {
    return <DocumentTitle title='document-title.forgot'>
      <div>
        <FormattedMessage tagName='h1' id='auth.forgot.title'/>
        <Link to='/' id='Logo'>
          <svg>
            <use xlinkHref='#MediaLogo'/>
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
            value={this.state.values.email || ''}>
            <Label data-validate-error='auth.error.no-email'>
              <Input
                onChange={this.generateValueEventUpdater(email => ({email}))}
                value={this.state.values.email || ''}
                type='text' name='email'
                placeholder='general.email-address'/>
            </Label>
          </ValidationElement>
          <div className='buttons'>
            <Submit value='general.reset'/>
          </div>
          <div className='forgot'>
            <div>
              <FormattedMessage
                id='auth.links.login3'
                values={{
                  link: <Link to='/auth'>
                    <FormattedMessage id='auth.links.login3.link'/>
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
      </div>
    </DocumentTitle>
  }
}

export default Forgot
