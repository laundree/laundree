// @flow
import React from 'react'
import { Input, Submit, Label } from './intl'
import { Link } from 'react-router-dom'
import { ValidationForm, ValidationElement } from './validation'
import ValueUpdater from './helpers/ValueUpdater'
import { FormattedMessage } from 'react-intl'
import type { Flash, State } from 'laundree-sdk/lib/redux'
import { connect } from 'react-redux'
import qs from 'querystring'

type LoginProps = {
  flash: Flash[],
  qs?: { [string]: string }
}

type LoginValues = {
  email: string,
  password: string
}

class LoginForm extends ValueUpdater<LoginValues, LoginProps, {}> {
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
          link: <Link to={'/auth/verification'}><FormattedMessage id='auth.error.not-verified.link' /></Link>
        }} />
    </div>
  }

  render () {
    return (
      <ValidationForm
        id='SignIn' method='post'
        action={`/auth/local${this.props.qs ? '?' + qs.stringify(this.props.qs) : ''}`}>
        {this.handleNotion()}
        <ValidationElement email trim value={this.state.values.email || ''}>
          <Label
            data-validate-error='auth.error.invalid-email'>
            <Input
              type='text'
              name='username'
              placeholder='general.email-address'
              value={this.state.values.email || ''}
              onChange={this.generateValueEventUpdater(email => ({email}))} />
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
              onChange={this.generateValueEventUpdater(password => ({password}))} />
          </Label>
        </ValidationElement>
        <div className='buttons'>
          <Submit value='general.login' />
        </div>
      </ValidationForm>
    )
  }
}

export default connect(({flash}: State, {location}): LoginProps => (
  {flash})
)(LoginForm)
