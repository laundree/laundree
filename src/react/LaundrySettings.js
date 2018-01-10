// @flow
import React from 'react'
import { Modal, Label, Submit, Meta } from './intl'
import ValueUpdater from './helpers/ValueUpdater'
import { ValidationForm, ValidationElement } from './validation'
import sdk from '../client/sdk'
import { FormattedMessage } from 'react-intl'
import Switch from './Switch'
import type { Laundry, User, State } from 'laundree-sdk/lib/redux'
import type { Time } from 'laundree-sdk/lib/sdk'
import LocationSelector from './LocationSelector'
import { connect } from 'react-redux'
import ReactGA from 'react-ga'

type LaundrySettingsFormValues = {
  name: string,
  place: string
}
type LaundrySettingsFormProps = {
  laundry: Laundry,
}

type LaundrySettingsFormState = {
  loading: boolean
}

class LaundrySettingsForm extends ValueUpdater<LaundrySettingsFormValues, LaundrySettingsFormProps, LaundrySettingsFormState> {

  onSubmit = (evt: Event) => {
    evt.preventDefault()
    this.setState({loading: true})
    sdk.api.laundry
      .updateLaundry(this.props.laundry.id, {name: this.state.values.name, googlePlaceId: this.state.values.place})
      .then(() => this.setState({loading: false, notion: null}))
      .catch(err => this.setState({loading: false, notion: {success: false, message: this.errorToMessage(err)}}))
  }

  errorToMessage ({status, message}) {
    switch (status) {
      case 409:
        return <FormattedMessage id='laundry-settings.name-or-place.error.duplicate' />
      case 400:
        return <FormattedMessage id='laundry-settings.name-or-place.error.invalid-place' />
      default:
        return message
    }
  }

  initialState () {
    return {loading: false}
  }

  initialValues () {
    return {
      name: this.props.laundry.name,
      place: this.props.laundry.googlePlaceId
    }
  }

  componentWillReceiveProps ({laundry: {name, googlePlaceId}}) {
    if (name === this.props.laundry.name && googlePlaceId === this.props.laundry.googlePlaceId) return
    this.reset({values: {name, place: googlePlaceId}})
  }

  nameErrorMessage () {
    return this.state.values.name.trim()
      ? 'laundry-settings.name-or-place.error.new-name'
      : 'laundry-settings.name-or-place.error.no-name'
  }

  placeErrorMessage () {
    const placeId = this.state.values.place
    if (!placeId) return 'laundry-settings.name-or-place.error.no-place'
    if (placeId === this.props.laundry.googlePlaceId) return 'laundry-settings.name-or-place.error.new-place'
    return 'laundry-settings.name-or-place.error.valid-place'
  }

  nameErrorValues () {
    if (this.state.values.place !== this.props.laundry.googlePlaceId) return []
    return ['', this.props.laundry.name]
  }

  render () {
    return <ValidationForm sesh={this.state.sesh} onSubmit={this.onSubmit} className={this.state.loading ? 'blur' : ''}>
      {this.renderNotion()}
      <ValidationElement sesh={this.state.sesh} value={this.state.values.name} notOneOf={this.nameErrorValues()} trim>
        <label data-validate-error={this.nameErrorMessage()}>
          <input
            type='text' value={this.state.values.name}
            onChange={this.generateValueEventUpdater(name => ({name}))} />
        </label>
      </ValidationElement>
      <ValidationElement
        sesh={this.state.sesh} value={this.state.values.place} nonEmpty>
        <Label data-validate-error={this.placeErrorMessage()}>
          <LocationSelector
            value={this.state.values.place}
            onChange={this.generateValueUpdater(place => ({place}))} />
        </Label>
      </ValidationElement>
      <div className='buttons'>
        <Submit value='general.update' />
      </div>
    </ValidationForm>
  }
}

class DeleteLaundry extends React.Component<{ laundry: Laundry, user: User }, { modalOpen: boolean }> {
  handleDeleteClick = () => this.deleteLaundry()
  handleCloseModal = () => this.setState({modalOpen: false})
  handleOpenModal = () => this.setState({modalOpen: true})
  state = {modalOpen: false}

  async deleteLaundry () {
    await sdk.api.laundry.del(this.props.laundry.id)
    ReactGA.event({category: 'Laundry', action: 'Delete laundry'})
  }

  render () {
    if (this.props.laundry.demo && this.props.user.role !== 'admin') {
      return <div className='text'>
        <FormattedMessage id='laundry-settings.delete-laundry.demo' />
      </div>
    }

    return <div className='text'>
      <FormattedMessage
        id='laundry-settings.delete-laundry.text'
        values={{
          nl: <br />
        }} />
      <Modal
        show={this.state.modalOpen}
        onClose={this.handleCloseModal}
        message='laundry-settings.delete-laundry.modal.message'
        actions={[
          {label: 'general.yes', className: 'delete red', action: this.handleDeleteClick},
          {label: 'general.no', action: this.handleCloseModal}
        ]} />
      <div className='buttonContainer'>
        <button onClick={this.handleOpenModal} className='red'>
          <FormattedMessage id='general.delete-laundry' />
        </button>
      </div>
    </div>
  }
}

class LeaveLaundry extends React.Component<{
  laundry: Laundry,
  user: User
}, { modalOpen: boolean }> {
  handleDeleteClick = () => this.removeUser()
  handleCloseModal = () => this.setState({modalOpen: false})
  handleOpenModal = () => this.setState({modalOpen: true})
  state = {modalOpen: false}

  async removeUser () {
    await sdk
      .api
      .laundry
      .removeUserFromLaundry(this.props.laundry.id, this.props.user.id)
    ReactGA.event({category: 'User', action: 'Leave laundry'})
  }

  render () {
    return <div className='text'>
      <FormattedMessage id='laundry-settings.leave-laundry.text' />
      <Modal
        show={this.state.modalOpen}
        onClose={this.handleCloseModal}
        message='laundry-settings.leave-laundry.modal.message'
        actions={[
          {label: 'general.yes', className: 'delete red', action: this.handleDeleteClick},
          {label: 'general.no', action: this.handleCloseModal}
        ]} />
      <div className='buttonContainer'>
        <button onClick={this.handleOpenModal} className='red'>
          <FormattedMessage id='general.leave-laundry' />
        </button>
      </div>
    </div>
  }
}

function timeStringToMinutes (time) {
  const obj = timeStringToObject(time)
  if (!obj) return 0
  return obj.hour * 60 + obj.minute
}

function timeStringToObject (time): ?Time {
  if (!time) return undefined
  const timeMatch = time.match(/^(\d+):(\d+)$/)
  if (!timeMatch || !timeMatch[1] || !timeMatch[2]) return undefined
  const minute = parseInt(timeMatch[2])
  const hour = parseInt(timeMatch[1])
  return {hour, minute}
}

function objectToTimeString ({hour, minute}) {
  return `${hour}:${minute < 10 ? `0${minute}` : minute}`
}

const bookingRulesDefaultValues = {
  timeLimitFrom: '0:00',
  timeLimitTo: '24:00',
  dailyLimit: 10,
  limit: 100
}

type BookingRulesValues = {
  timeLimitEnable: boolean,
  dailyLimitEnable: boolean,
  limitEnable: boolean,
  timeLimitFrom?: string,
  timeLimitTo?: string,
  dailyLimit?: number,
  dailyLimitString?: string,
  limit?: number,
  limitString?: string
}

function rulesToInitialValues ({dailyLimit, limit, timeLimit}): BookingRulesValues {
  const laundryValues: BookingRulesValues = {
    timeLimitEnable: false,
    dailyLimitEnable: false,
    limitEnable: false
  }
  if (dailyLimit !== undefined) {
    laundryValues.dailyLimitEnable = true
    laundryValues.dailyLimit = dailyLimit
  }
  if (limit !== undefined) {
    laundryValues.limitEnable = true
    laundryValues.limit = limit
  }
  if (timeLimit) {
    laundryValues.timeLimitEnable = true
    laundryValues.timeLimitFrom = objectToTimeString(timeLimit.from)
    laundryValues.timeLimitTo = objectToTimeString(timeLimit.to)
  }
  return {...bookingRulesDefaultValues, ...laundryValues}
}

type BookingRulesProps = {
  laundry: Laundry
}

type BookingRulesState = {}

function timeMap (timeString, def) {
  if (!timeString) return def
  const time = timeString.match(/(\d+)(?::(\d\d))?\s*(p?)/)
  if (!time) return def
  const hours = Math.max(Math.min(parseInt(time[1]) + (time[3] ? 12 : 0), 24), 0)
  const minutes = Math.max(Math.min(parseInt(time[2]) || 0, 60), 0)
  const roundMinutes = minutes - minutes % 30
  return `${hours}:${roundMinutes < 10 ? `0${roundMinutes}` : roundMinutes}`
}

function numberMap (number) {
  const int = parseInt(number)
  return isNaN(int) ? 0 : Math.max(int, 0)
}

class BookingRules extends ValueUpdater<BookingRulesValues, BookingRulesProps, BookingRulesState> {

  fromToValidator = ({from, to}) => timeStringToMinutes(to) > timeStringToMinutes(from)
  validateValues = ({
                      timeLimitEnable,
                      dailyLimitEnable,
                      limitEnable,
                      timeLimitFrom,
                      timeLimitTo,
                      dailyLimit,
                      limit
                    }) => {
    const values = this.initialValues()
    return timeLimitEnable !== values.timeLimitEnable ||
      dailyLimitEnable !== values.dailyLimitEnable ||
      limitEnable !== values.limitEnable ||
      timeLimitFrom !== values.timeLimitFrom ||
      timeLimitTo !== values.timeLimitTo ||
      dailyLimit !== values.dailyLimit ||
      limit !== values.limit
  }
  handleSubmit = evt => {
    evt.preventDefault()
    this.submit()
  }

  initialState () {
    return {}
  }

  compareRules ({limit, dailyLimit, timeLimit}) {
    const oldRules = this.props.laundry.rules
    if (limit !== oldRules.limit) return false
    if (dailyLimit !== oldRules.dailyLimit) return false
    if (timeLimit === oldRules.timeLimit) return true
    if (!timeLimit) return false
    if (!oldRules.timeLimit) return false
    if (timeLimit.from.hour !== oldRules.timeLimit.from.hour) return false
    if (timeLimit.from.minute !== oldRules.timeLimit.from.minute) return false
    if (timeLimit.to.hour !== oldRules.timeLimit.to.hour) return false
    return timeLimit.to.minute === oldRules.timeLimit.to.minute
  }

  componentWillReceiveProps ({laundry: {rules}}) {
    if (this.compareRules(rules)) return
    this.reset({values: rulesToInitialValues(rules)})
  }

  async submit () {
    const modifier = this.rules()
    await sdk.api.laundry.updateLaundry(this.props.laundry.id, modifier)
    ReactGA.event({category: 'Laundry', action: 'Update laundry'})
  }

  rules () {
    const ruleObject = {}
    if (this.state.values.limitEnable) {
      ruleObject.limit = this.state.values.limit
    }
    if (this.state.values.dailyLimitEnable) {
      ruleObject.dailyLimit = this.state.values.dailyLimit
    }
    if (this.state.values.timeLimitEnable) {
      const from = timeStringToObject(this.state.values.timeLimitFrom)
      const to = timeStringToObject(this.state.values.timeLimitTo)
      if (from && to) {
        ruleObject.timeLimit = {from, to}
      }
    }
    return {rules: ruleObject}
  }

  initialValues () {
    return rulesToInitialValues(this.props.laundry.rules)
  }

  generateSwitchUpdater (name: 'limitEnable' | 'timeLimitEnable' | 'dailyLimitEnable') {
    return this.generateValueUpdater(v => ({[name]: v}))
  }

  render () {
    return <ValidationForm id='BookingRules' onSubmit={this.handleSubmit}>
      <ValidationElement
        validator={this.validateValues}
        value={this.state.values} />
      <div className='rule'>
        <ValidationElement value={this.state.values.timeLimitEnable ? 'on' : 'off'}>
          <Switch
            on={this.state.values.timeLimitEnable}
            onChange={this.generateSwitchUpdater('timeLimitEnable')} />
        </ValidationElement>
        <div className={'ruleText ' + (this.state.values.timeLimitEnable ? 'on' : 'off')}>
          <FormattedMessage
            tagName='div'
            id='laundry-settings.booking-rules.time-limit'
            values={{
              fromInput: <input
                type='text'
                value={this.state.values.timeLimitFrom}
                onBlur={this.generateValueUpdater((v, {timeLimitFrom}) => ({timeLimitFrom: timeMap(timeLimitFrom, bookingRulesDefaultValues.timeLimitFrom)}))}
                onChange={this.generateValueEventUpdater(timeLimitFrom => ({timeLimitFrom}))} />,
              toInput: <input
                onBlur={this.generateValueUpdater((v, {timeLimitTo}) => ({timeLimitTo: timeMap(timeLimitTo, bookingRulesDefaultValues.timeLimitTo)}))}
                type='text' value={this.state.values.timeLimitTo}
                onChange={this.generateValueEventUpdater(timeLimitTo => ({timeLimitTo}))} />
            }}
          />
          <ValidationElement
            validator={this.fromToValidator}
            value={{from: this.state.values.timeLimitFrom, to: this.state.values.timeLimitTo}} />
        </div>
      </div>
      <div className='rule'>
        <ValidationElement value={this.state.values.dailyLimitEnable ? 'on' : 'off'}>
          <Switch
            on={this.state.values.dailyLimitEnable}
            onChange={this.generateSwitchUpdater('dailyLimitEnable')} />
        </ValidationElement>
        <div className={'ruleText ' + (this.state.values.dailyLimitEnable ? 'on' : 'off')}>
          <FormattedMessage
            tagName='div'
            id='laundry-settings.booking-rules.daily-max-hours'
            values={{
              hourInput: <input
                onBlur={this.generateValueUpdater((v, {dailyLimitString}) => ({
                  dailyLimitString: undefined,
                  dailyLimit: numberMap(dailyLimitString)
                }))}
                type='text' value={this.state.values.dailyLimitString || this.state.values.dailyLimit}
                onChange={this.generateValueEventUpdater(dailyLimitString => ({dailyLimitString}))} />,
              hour: this.state.values.dailyLimit || ''
            }} />
        </div>
      </div>
      <div className='rule'>
        <ValidationElement value={this.state.values.limitEnable ? 'on' : 'off'}>
          <Switch
            on={this.state.values.limitEnable}
            onChange={this.generateSwitchUpdater('limitEnable')} />
        </ValidationElement>
        <div className={'ruleText ' + (this.state.values.limitEnable ? 'on' : 'off')}>
          <FormattedMessage
            tagName='div'
            id='laundry-settings.booking-rules.max-hours'
            values={{
              hourInput: <input
                onBlur={this.generateValueUpdater((v, {limitString}) => ({
                  limitString: undefined,
                  limit: numberMap(limitString)
                }))}
                type='text' value={this.state.values.limitString || this.state.values.limit}
                onChange={this.generateValueEventUpdater(limitString => ({limitString}))} />,
              hour: this.state.values.limit || ''
            }} />
        </div>
      </div>
      <div className='buttonContainer'>
        <FormattedMessage tagName='button' id='general.update' />
      </div>
    </ValidationForm>
  }
}

type LaundrySettingsProps = {
  currentLaundry: string,
  laundries: { [string]: Laundry },
  user: ?User
}

class LaundrySettings extends React.Component<LaundrySettingsProps> {

  isOwner (user: User) {
    return user.role === 'admin' || this.laundry().owners.indexOf(user.id) >= 0
  }

  renderOwnerSettings (user: User) {
    if (!this.isOwner(user)) return null
    const laundry = this.laundry()
    return <div>
      <section id='LaundrySettingsNameOrPlace'>
        <FormattedMessage tagName='h2' id='laundry-settings.name-or-place.title' />
        <LaundrySettingsForm laundry={laundry} />
      </section>
      <section>
        <FormattedMessage tagName='h2' id='laundry-settings.booking-rules.title' />
        <BookingRules laundry={laundry} />
      </section>
      <section>
        <FormattedMessage tagName='h2' id='laundry-settings.delete-laundry.title' />
        <DeleteLaundry laundry={laundry} user={user} />
      </section>
    </div>
  }

  laundry () {
    return this.props.laundries[this.props.currentLaundry]
  }

  renderUserSettings (user: User) {
    return <section>
      <FormattedMessage id='laundry-settings.leave-laundry' tagName='h2' />
      <LeaveLaundry laundry={this.laundry()} user={user} />
    </section>
  }

  render () {
    const user = this.props.user
    if (!this.laundry()) return null
    if (!user) return null
    return (
      <main className='naved' id='LaundrySettings'>
        <Meta title={'document-title.laundry-settings'} />
        <FormattedMessage id='laundry-settings.title' tagName='h1' />
        {this.isOwner(user)
          ? this.renderOwnerSettings(user)
          : this.renderUserSettings(user)}
      </main>)
  }
}

export default connect(({users, currentUser, laundries}: State, {match: {params: {laundryId}}}): LaundrySettingsProps => ({
  user: (currentUser && users[currentUser]) || null,
  laundries,
  currentLaundry: laundryId
}))(LaundrySettings)
