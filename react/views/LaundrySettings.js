const React = require('react')
const {Modal, Label, Submit, DocumentTitle} = require('./intl')
const {ValueUpdater} = require('./helpers')
const {ValidationForm, ValidationElement} = require('./validation')
const sdk = require('../../client/sdk')
const {FormattedMessage} = require('react-intl')
const LocationSelector = require('./LocationSelector')

class LaundrySettingsForm extends ValueUpdater {

  constructor (props) {
    super(props)
    this.onSubmit = (evt) => {
      evt.preventDefault()
      this.setState({loading: true})
      sdk.laundry(this.props.laundry.id)
        .updateLaundry({name: this.state.values.name, googlePlaceId: this.state.values.place})
        .then(() => this.setState({loading: false, notion: null}))
        .catch(err => this.setState({loading: false, notion: {success: false, message: this.errorToMessage(err)}}))
    }
  }

  errorToMessage ({status, message}) {
    switch (status) {
      case 409:
        return <FormattedMessage id='laundry-settings.name-or-place.error.duplicate'/>
      case 400:
        return <FormattedMessage id='laundry-settings.name-or-place.error.invalid-place'/>
      default:
        return message
    }
  }

  get initialValues () {
    return {
      name: this.props.laundry.name,
      place: this.props.laundry.googlePlaceId
    }
  }

  componentWillReceiveProps ({laundry: {name, googlePlaceId}}) {
    if (name === this.props.laundry.name && googlePlaceId === this.props.laundry.googlePlaceId) return
    this.reset({values: {name, place: googlePlaceId}})
  }

  get nameErrorMessage () {
    return this.state.values.name.trim()
      ? 'laundry-settings.name-or-place.error.new-name'
      : 'laundry-settings.name-or-place.error.no-name'
  }

  get placeErrorMessage () {
    const placeId = this.state.values.place
    if (!placeId) return 'laundry-settings.name-or-place.error.no-place'
    if (placeId === this.props.laundry.googlePlaceId) return 'laundry-settings.name-or-place.error.new-place'
    return 'laundry-settings.name-or-place.error.valid-place'
  }

  get nameErrorValues () {
    if (this.state.values.place !== this.props.laundry.googlePlaceId) return []
    return ['', this.props.laundry.name]
  }

  render () {
    return <ValidationForm sesh={this.state.sesh} onSubmit={this.onSubmit} className={this.state.loading ? 'blur' : ''}>
      {this.renderNotion()}
      <ValidationElement sesh={this.state.sesh} value={this.state.values.name} notOneOf={this.nameErrorValues} trim>
        <label data-validate-error={this.nameErrorMessage}>
          <input type='text' value={this.state.values.name} onChange={this.generateValueUpdater('name')}/>
        </label>
      </ValidationElement>
      <ValidationElement
        sesh={this.state.sesh} value={this.state.values.place} nonEmpty>
        <Label data-validate-error={this.placeErrorMessage}>
          <LocationSelector
            googleApiKey={this.props.googleApiKey}
            locale={this.props.locale}
            value={this.state.values.place}
            onChange={this.generateValueUpdater('place')}/>
        </Label>
      </ValidationElement>
      <div className='buttons'>
        <Submit value='general.update'/>
      </div>
    </ValidationForm>
  }
}

LaundrySettingsForm.propTypes = {
  locale: React.PropTypes.string.isRequired,
  googleApiKey: React.PropTypes.string.isRequired,
  laundry: React.PropTypes.object.isRequired
}

class DeleteLaundry extends React.Component {

  constructor (props) {
    super(props)
    this.state = {modalOpen: false}
    this.handleDeleteClick = () => this.deleteLaundry()
    this.handleCloseModal = () => this.setState({modalOpen: false})
    this.handleOpenModal = () => this.setState({modalOpen: true})
  }

  deleteLaundry () {
    return sdk.laundry(this.props.laundry.id).del()
  }

  render () {
    if (this.props.laundry.demo && this.props.user.role !== 'admin') {
      return <div className='text'>
        <FormattedMessage id='laundry-settings.delete-laundry.demo'/>
      </div>
    }

    return <div className='text'>
      <FormattedMessage
        id='laundry-settings.delete-laundry.text'
        values={{
          nl: <br />
        }}/>
      <Modal
        show={this.state.modalOpen}
        onClose={this.handleCloseModal}
        message='laundry-settings.delete-laundry.modal.message'
        actions={[
          {label: 'general.yes', className: 'delete red', action: this.handleDeleteClick},
          {label: 'general.no', action: this.handleCloseModal}
        ]}/>
      <div className='buttonContainer'>
        <button onClick={this.handleOpenModal} className='red'>
          <FormattedMessage id='general.delete-laundry'/>
        </button>
      </div>
    </div>
  }

}

DeleteLaundry.propTypes = {
  laundry: React.PropTypes.object.isRequired,
  user: React.PropTypes.object.isRequired
}

class LeaveLaundry extends React.Component {

  constructor (props) {
    super(props)
    this.state = {modalOpen: false}
    this.handleDeleteClick = () => this.removeUser()
    this.handleCloseModal = () => this.setState({modalOpen: false})
    this.handleOpenModal = () => this.setState({modalOpen: true})
  }

  removeUser () {
    return sdk.laundry(this.props.laundry.id).removeUserFromLaundry(this.props.user.id)
  }

  render () {
    return <div className='text'>
      <FormattedMessage id='laundry-settings.leave-laundry.text'/>
      <Modal
        show={this.state.modalOpen}
        onClose={this.handleCloseModal}
        message='laundry-settings.leave-laundry.modal.message'
        actions={[
          {label: 'general.yes', className: 'delete red', action: this.handleDeleteClick},
          {label: 'general.no', action: this.handleCloseModal}
        ]}/>
      <div className='buttonContainer'>
        <button onClick={this.handleOpenModal} className='red'>
          <FormattedMessage id='general.leave-laundry'/>
        </button>
      </div>
    </div>
  }

}

LeaveLaundry.propTypes = {
  laundry: React.PropTypes.object.isRequired,
  user: React.PropTypes.object.isRequired
}
class Switch extends React.Component {

  constructor (props) {
    super(props)
    this.onClick = () => this.props.onChange(!this.isOn)
  }

  get isOn () {
    return Boolean(this.props.on)
  }

  render () {
    return <div
      onClick={this.onClick}
      className={'switch ' + (this.isOn ? 'on' : 'off')}/>
  }
}

Switch.propTypes = {
  on: React.PropTypes.bool,
  onChange: React.PropTypes.func.isRequired
}

function timeStringToMinutes (time) {
  const obj = timeStringToObject(time)
  if (!obj) return 0
  return obj.hour * 60 + obj.minute
}

function timeStringToObject (time) {
  const timeMatch = time.match(/^(\d+):(\d+)$/)
  if (!timeMatch || !timeMatch[1] || !timeMatch[2]) return undefined
  return {hour: parseInt(timeMatch[1]), minute: parseInt(timeMatch[2])}
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

function rulesToInitialValues ({dailyLimit, limit, timeLimit}) {
  const laundryValues = {
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
  return Object.assign({}, bookingRulesDefaultValues, laundryValues)
}

class BookingRules extends ValueUpdater {

  constructor (props) {
    super(props)
    this.timeMap = timeString => {
      const time = timeString.match(/(\d+)(?::(\d\d))?\s*(p?)/)
      if (!time) return '0:00'
      const hours = Math.max(Math.min(parseInt(time[1]) + (time[3] ? 12 : 0), 24), 0)
      const minutes = Math.max(Math.min(parseInt(time[2]) || 0, 60), 0)
      const roundMinutes = minutes - minutes % 30
      return `${hours}:${roundMinutes < 10 ? `0${roundMinutes}` : roundMinutes}`
    }
    this.numberMap = number => {
      const int = parseInt(number)
      return isNaN(int) ? 0 : Math.max(int, 0)
    }
    this.fromToValidator = ({from, to}) => timeStringToMinutes(to) > timeStringToMinutes(from)
    this.validateValues = ({
      timeLimitEnable,
      dailyLimitEnable,
      limitEnable,
      timeLimitFrom,
      timeLimitTo,
      dailyLimit,
      limit
    }) => {
      const values = this.initialValues
      return timeLimitEnable !== values.timeLimitEnable ||
        dailyLimitEnable !== values.dailyLimitEnable ||
        limitEnable !== values.limitEnable ||
        timeLimitFrom !== values.timeLimitFrom ||
        timeLimitTo !== values.timeLimitTo ||
        dailyLimit !== values.dailyLimit ||
        limit !== values.limit
    }
    this.handleSubmit = evt => {
      evt.preventDefault()
      this.submit()
    }
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
    return timeLimit.to.minute === oldRules.to.minute
  }

  componentWillReceiveProps ({laundry: {rules}}) {
    if (this.compareRules(rules)) return
    this.reset({values: rulesToInitialValues(rules)})
  }

  submit () {
    sdk.laundry(this.props.laundry.id).updateLaundry({rules: this.rules})
  }

  get rules () {
    const ruleObject = {}
    if (this.state.values.limitEnable) {
      ruleObject.limit = this.state.values.limit
    }
    if (this.state.values.dailyLimitEnable) {
      ruleObject.dailyLimit = this.state.values.dailyLimit
    }
    if (this.state.values.timeLimitEnable) {
      ruleObject.timeLimit = {
        from: timeStringToObject(this.state.values.timeLimitFrom),
        to: timeStringToObject(this.state.values.timeLimitTo)
      }
    }
    return ruleObject
  }

  get initialValues () {
    return rulesToInitialValues(this.props.laundry.rules)
  }

  generateSwitchUpdater (name) {
    const f = this.generateValueUpdater(name)
    return value => {
      if (value) return f(value)
      switch (name) {
        case 'limitEnable':
          const {limit} = bookingRulesDefaultValues
          this.updateValue({limit})
          break
        case 'timeLimitEnable':
          const {timeLimitFrom, timeLimitTo} = bookingRulesDefaultValues
          this.updateValue({timeLimitFrom, timeLimitTo})
          break
        case 'dailyLimitEnable':
          const {dailyLimit} = bookingRulesDefaultValues
          this.updateValue({dailyLimit})
          break
      }
      return f(value)
    }
  }

  render () {
    return <ValidationForm id='BookingRules' onSubmit={this.handleSubmit}>
      <ValidationElement
        validator={this.validateValues}
        value={this.state.values}/>
      <div className='rule'>
        <ValidationElement value={this.state.values.timeLimitEnable ? 'on' : 'off'}>
          <Switch
            on={this.state.values.timeLimitEnable}
            onChange={this.generateSwitchUpdater('timeLimitEnable')}/>
        </ValidationElement>
        <div className={'ruleText ' + (this.state.values.timeLimitEnable ? 'on' : 'off')}>
          <FormattedMessage
            tagName='div'
            id='laundry-settings.booking-rules.time-limit'
            values={{
              fromInput: <input
                type='text'
                value={this.state.values.timeLimitFrom}
                onBlur={this.generateValueMapper('timeLimitFrom', this.timeMap)}
                onChange={this.generateValueUpdater('timeLimitFrom')}/>,
              toInput: <input
                onBlur={this.generateValueMapper('timeLimitTo', this.timeMap)}
                type='text' value={this.state.values.timeLimitTo}
                onChange={this.generateValueUpdater('timeLimitTo')}/>
            }}
          />
          <ValidationElement
            validator={this.fromToValidator}
            value={{from: this.state.values.timeLimitFrom, to: this.state.values.timeLimitTo}}/>
        </div>
      </div>
      <div className='rule'>
        <ValidationElement value={this.state.values.dailyLimitEnable ? 'on' : 'off'}>
          <Switch
            on={this.state.values.dailyLimitEnable}
            onChange={this.generateSwitchUpdater('dailyLimitEnable')}/>
        </ValidationElement>
        <div className={'ruleText ' + (this.state.values.dailyLimitEnable ? 'on' : 'off')}>
          <FormattedMessage
            tagName='div'
            id='laundry-settings.booking-rules.daily-max-hours'
            values={{
              hourInput: <input
                onBlur={this.generateValueMapper('dailyLimit', this.numberMap)}
                type='text' value={this.state.values.dailyLimit}
                onChange={this.generateValueUpdater('dailyLimit')}/>,
              hour: this.state.values.dailyLimit
            }}/>
        </div>
      </div>
      <div className='rule'>
        <ValidationElement value={this.state.values.limitEnable ? 'on' : 'off'}>
          <Switch
            on={this.state.values.limitEnable}
            onChange={this.generateSwitchUpdater('limitEnable')}/>
        </ValidationElement>
        <div className={'ruleText ' + (this.state.values.limitEnable ? 'on' : 'off')}>
          <FormattedMessage
            tagName='div'
            id='laundry-settings.booking-rules.max-hours'
            values={{
              hourInput: <input
                onBlur={this.generateValueMapper('limit', this.numberMap)}
                type='text' value={this.state.values.limit}
                onChange={this.generateValueUpdater('limit')}/>,
              hour: this.state.values.limit
            }}/>
        </div>
      </div>
      <div className='buttonContainer'>
        <FormattedMessage tagName='button' id='general.update'/>
      </div>
    </ValidationForm>
  }
}

BookingRules.propTypes = {
  laundry: React.PropTypes.object.isRequired
}

class LaundrySettings extends React.Component {

  get isOwner () {
    return this.props.user.role === 'admin' || this.laundry.owners.indexOf(this.props.user.id) >= 0
  }

  renderOwnerSettings () {
    if (!this.isOwner) return null
    return <div>
      <section id='LaundrySettingsNameOrPlace'>
        <FormattedMessage tagName='h2' id='laundry-settings.name-or-place.title'/>
        <LaundrySettingsForm laundry={this.laundry} googleApiKey={this.props.googleApiKey} locale={this.props.locale}/>
      </section>
      <section>
        <FormattedMessage tagName='h2' id='laundry-settings.booking-rules.title'/>
        <BookingRules laundry={this.laundry}/>
      </section>
      <section>
        <FormattedMessage tagName='h2' id='laundry-settings.delete-laundry.title'/>
        <DeleteLaundry laundry={this.laundry} user={this.props.user}/>
      </section>
    </div>
  }

  get laundry () {
    return this.props.laundries[this.props.currentLaundry]
  }

  renderUserSettings () {
    return <section>
      <FormattedMessage id='laundry-settings.leave-laundry' tagName='h2'/>
      <LeaveLaundry laundry={this.laundry} user={this.props.user}/>
    </section>
  }

  render () {
    if (!this.laundry) return null
    return <DocumentTitle title='document-title.laundry-settings'>
      <main className='naved' id='LaundrySettings'>
        <FormattedMessage id='laundry-settings.title' tagName='h1'/>
        {this.isOwner ? this.renderOwnerSettings() : this.renderUserSettings()}
      </main>
    </DocumentTitle>
  }
}

LaundrySettings.propTypes = {
  currentLaundry: React.PropTypes.string,
  laundries: React.PropTypes.object,
  locale: React.PropTypes.string.isRequired,
  googleApiKey: React.PropTypes.string.isRequired,
  user: React.PropTypes.shape({
    id: React.PropTypes.string,
    role: React.PropTypes.string,
    photo: React.PropTypes.string
  })
}

module.exports = LaundrySettings
