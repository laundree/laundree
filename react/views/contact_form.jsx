const React = require('react')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const sdk = require('../../client/sdk')
const {FormattedMessage} = require('react-intl')
const {Input, Label, TextArea, Submit} = require('./intl')

const UserInput = ({user: {photo, displayName}}) => <div className='userInput'>
  <img className='avatar' src={photo}/>
  <span className='name'>{displayName}</span>
</div>

UserInput.propTypes = {
  user: React.PropTypes.shape({
    photo: React.PropTypes.string.isRequired,
    displayName: React.PropTypes.string.isRequired
  }).isRequired
}

class ContactForm extends ValueUpdater {

  constructor (props) {
    super(props)
    this.onSubmit = (evt) => {
      evt.preventDefault()
      this.submit()
    }
  }

  submit () {
    this.setState({loading: true})
    const {email, name, subject, message} = this.state.values
    sdk
      .contact({name: name || undefined, email: email || undefined, message, subject})
      .then(() => this.reset({loading: false, sent: true}))
  }

  get initialValues () {
    return {
      name: '',
      subject: '',
      message: '',
      email: ''
    }
  }

  renderUser () {
    if (this.props.user) return <UserInput user={this.props.user}/>
    return <ValidationElement sesh={this.state.sesh} value={this.state.values.name} nonEmpty trim>
      <Label data-validate-error='contact-form.error.no-name'>
        <Input
          readOnly={Boolean(this.props.user)}
          placeholder='general.name'
          type='text' value={this.state.values.name} onChange={this.generateValueUpdater('name')}/>
      </Label>
    </ValidationElement>
  }

  renderEmail () {
    if (this.props.user) return null
    return <ValidationElement sesh={this.state.sesh} value={this.state.values.email} email trim>
      <Label data-validate-error='contact-form.error.invalid-email'>
        <Input
          readOnly={Boolean(this.props.user)}
          placeholder='general.email-address'
          type='text' value={this.state.values.email}
          onChange={this.generateValueUpdater('email')}/>
      </Label>
    </ValidationElement>
  }

  renderSent () {
    return <div className='contactForm sent'>
      <FormattedMessage id={'contact-form.success'}/>
    </div>
  }

  render () {
    if (this.state.sent) return this.renderSent()
    return <ValidationForm
      sesh={this.state.sesh} className={'contactForm' + (this.state.loading ? ' blur' : '')}
      onSubmit={this.onSubmit}>
      {this.renderUser()}
      {this.renderEmail()}
      <ValidationElement sesh={this.state.sesh} value={this.state.values.subject} nonEmpty trim>
        <Label data-validate-error='contact-form.error.no-subject'>
          <Input
            placeholder='general.subject'
            type='text' value={this.state.values.subject} onChange={this.generateValueUpdater('subject')}/>
        </Label>
      </ValidationElement>
      <ValidationElement sesh={this.state.sesh} value={this.state.values.message} nonEmpty trim>
        <Label data-validate-error='contact-form.error.no-message'>
          <TextArea
            placeholder='general.message'
            value={this.state.values.message} onChange={this.generateValueUpdater('message')}/>
        </Label>
      </ValidationElement>
      <div className='buttons'>
        <Submit value='general.send'/>
      </div>
    </ValidationForm>
  }
}

ContactForm.propTypes = {
  user: React.PropTypes.object
}

module.exports = ContactForm
