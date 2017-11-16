import React from 'react'
import type { LocaleType } from '../../locales/index'
import ValueUpdater from './helpers/ValueUpdater'
import sdk from '../../client/sdk'
import { FormattedMessage } from 'react-intl'
import ValidationForm from './validation/ValidationForm'
import ValidationElement from './validation/ValidationElement'
import { Input, Label, Submit } from './intl'
import LocationSelector from './LocationSelector'
import { connect } from 'react-redux'
import type { StateAddendum } from './types'

type SignUpState = {
  loading: boolean,
  sesh: number
}
type SignUpProps = {
  locale: LocaleType,
  createLaundry: boolean,
  locale: LocaleType,
  googleApiKey: string
}
type SignUpValues = {
  name: string,
  email: string,
  password: string,
  password2: string,
  placeId: string,
  laundryName: string
}

class SignUpForm extends ValueUpdater<SignUpValues, SignUpProps, SignUpState> {

  initialState () {
    return {loading: false, sesh: 0}
  }

  initialValues () {
    return {name: '', email: '', password: '', password2: ''}
  }

  componentWillReceiveProps ({createLaundry}) {
    if (this.props.createLaundry === createLaundry) {
      return
    }
    this.setState(({sesh}) => ({sesh: sesh + 1, notion: null}))
  }

  submitHandler = async (evt: Event) => {
    this.setState({loading: true})
    evt.preventDefault()
    try {
      await sdk.api.user.signUpUser(
        {
          displayName: this.state.values.name,
          email: this.state.values.email,
          password: this.state.values.password,
          locale: this.props.locale
        }
      )
      this.reset({
        loading: false,
        notion: {message: <FormattedMessage id='auth.signup.success' />, success: true}
      })
    } catch (err) {
      this.setState({
        loading: false,
        notion: {
          success: false,
          message: <FormattedMessage id={err.status === 409
            ? 'auth.signup.error.already-exists'
            : 'auth.signup.error'} />
        }
      })
    }
  }

  render () {
    return (
      <ValidationForm
        sesh={this.state.sesh}
        className={this.state.loading ? 'blur' : ''}
        onSubmit={this.submitHandler}>
        {this.renderNotion()}
        <ValidationElement
          nonEmpty
          trim sesh={this.state.sesh}
          initial={this.state.values.name === undefined}
          value={this.state.values.name || ''}>
          <Label data-validate-error='auth.error.no-full-name'>
            <Input
              type='text'
              name='name'
              placeholder='general.full-name'
              value={this.state.values.name || ''}
              onChange={this.generateValueEventUpdater(name => ({name}))}
            />
          </Label>
        </ValidationElement>
        <ValidationElement
          email
          trim sesh={this.state.sesh}
          initial={this.state.values.email === undefined}
          value={this.state.values.email || ''}>
          <Label
            data-validate-error='auth.error.invalid-email'>
            <Input
              value={this.state.values.email || ''}
              onChange={this.generateValueEventUpdater(email => ({email}))}
              type='text' name='email' placeholder='general.email-address' />
          </Label>
        </ValidationElement>
        <ValidationElement
          initial={this.state.values.password === undefined}
          password
          trim sesh={this.state.sesh}
          value={this.state.values.password || ''}>
          <Label data-validate-error='auth.error.invalid-password'>
            <Input
              value={this.state.values.password || ''}
              onChange={this.generateValueEventUpdater(password => ({password}))}
              type='password' name='password' placeholder='general.password' />
          </Label>
        </ValidationElement>
        <ValidationElement
          initial={this.state.values.password2 === undefined}
          sesh={this.state.sesh}
          validator={() => this.state.values.password === this.state.values.password2 && this.state.values.password2}
          value={this.state.values.password2 || ''}>
          <Label data-validate-error='auth.error.invalid-repeated-password'>
            <Input
              value={this.state.values.password2 || ''}
              onChange={this.generateValueEventUpdater(password2 => ({password2}))}
              type='password' name='password2' placeholder='general.repeat-password' />
          </Label>
        </ValidationElement>
        {this.props.createLaundry
          ? (<div style={{paddingTop: '2em'}}>
            <ValidationElement
              initial={this.state.values.laundryName === undefined}
              sesh={this.state.sesh}
              validator={v => !this.props.createLaundry || v}
              value={this.state.values.laundryName || ''}>
              <Label data-validate-error='home.logged-in.error.invalid-laundry-name'>
                <Input
                  value={this.state.values.laundryName || ''}
                  onChange={this.generateValueEventUpdater(laundryName => ({laundryName}))}
                  type='text'
                  name='laundryName' placeholder='general.laundry-name' />
              </Label>
            </ValidationElement>
            <ValidationElement
              initial={this.state.values.placeId === undefined}
              sesh={this.state.sesh}
              validator={v => !this.props.createLaundry || v}
              value={this.state.values.placeId || ''}>
              <Label data-validate-error='home.logged-in.error.invalid-laundry-address'>
                <LocationSelector
                  locale={this.props.locale}
                  googleApiKey={this.props.googleApiKey}
                  value={this.state.values.placeId}
                  onChange={this.generateValueUpdater((placeId: string) => ({placeId}))} />
              </Label>
            </ValidationElement>
          </div>)
          : null}
        <div className='buttons'>
          <Submit
            value={this.props.createLaundry ? 'general.create-laundry' : 'general.create-account'}
            className='create' />
        </div>
      </ValidationForm>)
  }
}

export default connect(({config: {locale, googleApiKey}}: StateAddendum): SignUpProps => ({
  locale, googleApiKey
}))(SignUpForm)
