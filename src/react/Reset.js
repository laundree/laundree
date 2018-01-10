// @flow
import React from 'react'
import { Link } from 'react-router-dom'
import { ValidationForm, ValidationElement } from './validation'
import ValueUpdater from './helpers/ValueUpdater'
import sdk from '../client/sdk'
import { Meta, Input, Submit, Label } from './intl'
import { FormattedMessage } from 'react-intl'
import type { Location } from 'react-router'
import queryString from 'querystring'
import type { LocaleType } from '../locales/index'
import ReactGA from 'react-ga'

type ResetValues = {
  password: string
}

type ResetProps = {
  location: Location,
  locale: LocaleType
}

type ResetState = {
  loading: boolean
}

export default class Reset extends ValueUpdater<ResetValues, ResetProps, ResetState> {

  initialState (): ResetState {
    return {loading: false}
  }

  initialValues () {
    return {password: ''}
  }

  submitHandler = async (evt: Event) => {
    const search = this.props.location.search && this.props.location.search.substr(1)
    const {user, token} = queryString.parse(search)
    this.setState({loading: true})
    evt.preventDefault()
    try {
      await sdk.api.user.resetPassword(user, {token, password: this.state.values.password})
      ReactGA.event({category: 'User', action: 'Reset password'})
      this.reset({
        loading: false,
        notion: {message: <FormattedMessage id='auth.reset.success' />, success: true}
      })
    } catch (err) {
      this.setState({
        loading: false,
        notion: {message: <FormattedMessage id='auth.reset.error' />, success: false}
      })
    }
  }

  render () {
    return (<div>
      <Meta title={'document-title.reset-password'} />
      <FormattedMessage tagName='h1' id='auth.forgot.title' />
      <Link to={'/'} id='Logo'>
        <svg>
          <use xlinkHref='#MediaLogo' />
        </svg>
      </Link>
      <ValidationForm
        sesh={this.state.sesh}
        onSubmit={this.submitHandler}
        id='ResetPassword'>
        {this.renderNotion()}
        <ValidationElement
          sesh={this.state.sesh}
          password trim value={this.state.values.password || ''}>
          <Label data-validate-error='auth.error.invalid-password'>
            <Input
              onChange={this.generateValueEventUpdater(password => ({password}))}
              value={this.state.values.password || ''}
              type='password' name='password' placeholder='general.new-password' />
          </Label>
        </ValidationElement>
        <div className='buttons'>
          <Submit value='general.reset' />
        </div>
        <div className='forgot'>
          <div>
            <FormattedMessage
              id='auth.links.login3'
              values={{
                link: (
                  <Link to={'/auth'}>
                    <FormattedMessage id='auth.links.login3.link' />
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
    </div>)
  }
}
