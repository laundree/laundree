// @flow
import React from 'react'
import { ValidationForm, ValidationElement } from './validation'
import ValueUpdater from './helpers/ValueUpdater'
import sdk from '../../client/sdk'
import { FormattedMessage } from 'react-intl'
import { Input, Label, Submit, DocumentTitle } from './intl'
import LocationSelector from './LocationSelector'
import type {LocaleType} from '../../locales'
import type {User} from 'laundree-sdk/lib/redux'

type CreateLaundryProps = {
  user: User,
  googleApiKey: string,
  locale: LocaleType
}
type CreateLaundryState = {
  createExpanded: boolean,
  loading: boolean,
  results: string[]
}
type CreateLaundryFormValues = { name: string, placeId: string }

export default class CreateLaundry extends ValueUpdater<CreateLaundryFormValues, CreateLaundryProps, CreateLaundryState> {

  initialValues () {
    return {name: '', placeId: ''}
  }

  initialState () {
    return {createExpanded: false, loading: false, results: []}
  }

  expander = (evt: Event) => {
    if (typeof evt.target.blur === 'function') {
      evt.target.blur()
    }
    this.setState(({createExpanded}) => ({createExpanded: !createExpanded}))
  }
  onSubmit = (event: Event) => {
    event.preventDefault()
    this.setState({loading: true})
    sdk.api.laundry
      .createLaundry({name: this.state.values.name.trim(), googlePlaceId: this.state.values.placeId})
      .catch((err) => this.setState({loading: false, notion: CreateLaundry.errorToNotion(err)}))
  }

  calculateClassName () {
    let className = 'create'
    if (this.state.createExpanded) className += ' expanded'
    if (this.state.notion) className += ' has_notion'
    return className
  }

  static errorToNotion (err: *) {
    let message
    switch (err.status) {
      case 409:
        message = <FormattedMessage id='home.logged-in.error.duplicate' />
        break
      case 500:
        message = <FormattedMessage id='home.logged-in.error.duplicate' />
        break
      default:
        message = <FormattedMessage id='home.logged-in.error.unknown' />
    }
    return {success: false, message}
  }

  valueUpdaterPlaceId:(string) => void = this.generateValueUpdater((placeId: string) => ({placeId}))

  render () {
    return <DocumentTitle title='document-title.create-laundry'>
      <main id='CreateLaundry'>
        <FormattedMessage id='home.logged-in.title' tagName='h1' />
        <section>
          <FormattedMessage tagName='div' id='home.logged-in.message' />
          <div className={this.calculateClassName()}>
            <ValidationForm className={this.state.loading ? 'blur' : ''} onSubmit={this.onSubmit}>
              {this.renderNotion()}
              <ValidationElement name='name' nonEmpty value={this.state.values.name}>
                <Label data-validate-error='home.logged-in.error.invalid-laundry-name'>
                  <Input
                    type='text'
                    value={this.state.values.name}
                    onChange={this.generateValueEventUpdater((name: string) => ({name}))}
                    placeholder='general.laundry-name' />
                </Label>
              </ValidationElement>
              <ValidationElement value={this.state.values.placeId} nonEmpty>
                <Label data-validate-error='home.logged-in.error.invalid-laundry-address'>
                  <LocationSelector
                    locale={this.props.locale}
                    googleApiKey={this.props.googleApiKey}
                    value={this.state.values.placeId}
                    onChange={this.valueUpdaterPlaceId} />
                </Label>
              </ValidationElement>
              <div className='buttons'>
                <Submit value='general.create' />
              </div>
            </ValidationForm>
            <div className='expand_button'>
              <button onClick={this.expander}>
                <FormattedMessage id='home.logged-in.button.create' />
              </button>
            </div>
          </div>
          <FormattedMessage tagName='div' id='home.logged-in.message.tenant' />
        </section>
      </main>
    </DocumentTitle>
  }
}
