const React = require('react')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const sdk = require('../../client/sdk')

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
      <label data-validate-error='Please enter your name'>
        <input
          readOnly={Boolean(this.props.user)}
          placeholder='Name'
          type='text' value={this.state.values.name} onChange={this.generateValueUpdater('name')}/>
      </label>
    </ValidationElement>
  }

  renderEmail () {
    if (this.props.user) return null
    return <ValidationElement sesh={this.state.sesh} value={this.state.values.email} email trim>
      <label data-validate-error='Please enter your email address'>
        <input
          readOnly={Boolean(this.props.user)}
          placeholder='E-mail address'
          type='text' value={this.state.values.email} onChange={this.generateValueUpdater('email')}/>
      </label>
    </ValidationElement>
  }

  renderSent () {
    return <div className='contactForm sent'>
      Your message has been sent!
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
        <label data-validate-error='Please enter a subject'>
          <input
            placeholder='Subject'
            type='text' value={this.state.values.subject} onChange={this.generateValueUpdater('subject')}/>
        </label>
      </ValidationElement>
      <ValidationElement sesh={this.state.sesh} value={this.state.values.message} nonEmpty trim>
        <label data-validate-error='Please write a message'>
          <textarea
            placeholder='Message'
            value={this.state.values.message} onChange={this.generateValueUpdater('message')}/>
        </label>
      </ValidationElement>
      <div className='buttons'>
        <input type='submit' value='Send'/>
      </div>
    </ValidationForm>
  }
}

ContactForm.propTypes = {
  user: React.PropTypes.object
}

module.exports = ContactForm
