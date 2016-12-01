/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('./document-title-intl.jsx')
const {Link} = require('react-router')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const sdk = require('../../client/sdk')
const {FormattedMessage, injectIntl} = require('react-intl')

class Forgot extends ValueUpdater {
  constructor (props) {
    super(props)
    this.submitHandler = (evt) => {
      this.setState({loading: true})
      evt.preventDefault()
      return sdk.user.forgotPassword(this.state.values.email.toLowerCase())
        .then(
          () =>
            this.reset({
              loading: false,
              message: {message: 'auth.forgot.success', type: 'success'}
            }),
          () => this.setState({
            loading: false,
            message: {message: 'auth.forgot.error', type: 'error'}
          }))
    }
  }

  renderMessage () {
    if (!this.state.message) return
    return <div className={'notion ' + (this.state.message.type || '')}>
      <FormattedMessage id={this.state.message.message}/>
    </div>
  }

  render () {
    return <DocumentTitle id='document-title.resend-verification'>
      <div>
        <FormattedMessage tagName='h1' id='auth.forgot.title'/>
        <Link to='/' id='Logo'>
          <svg>
            <use xlinkHref='#Logo'/>
          </svg>
        </Link>
        <ValidationForm
          sesh={this.state.sesh}
          className={this.state.loading ? 'blur' : ''}
          onSubmit={this.submitHandler}
          id='ForgotPassword'>
          {this.renderMessage()}
          <ValidationElement
            email
            trim
            sesh={this.state.sesh}
            value={this.state.values.email || ''}>
            <label data-validate-error={this.props.intl.formatMessage({id: 'auth.error.no-email'})}>
              <input
                onChange={this.generateValueUpdater('email')}
                value={this.state.values.email || ''}
                type='text' name='email'
                placeholder={this.props.intl.formatMessage({id: 'general.email-address'})}/>
            </label>
          </ValidationElement>
          <div className='buttons'>
            <input type='submit' value='Reset'/>
          </div>
          <div className='forgot'>
            <div>
              <FormattedMessage
                id='auth.links.login3'
                values={{
                  link: <Link to='/auth'>
                    {this.props.intl.formatMessage({id: 'auth.links.login3.link'})}
                  </Link>
                }}/>
            </div>
            <div>
              <FormattedMessage
                id='auth.links.signup'
                values={{
                  link: <Link
                    to='/auth/sign-up'
                    className='forgot'>{this.props.intl.formatMessage({id: 'auth.links.signup.link'})}</Link>
                }}/>
            </div>
          </div>
        </ValidationForm>
      </div>
    </DocumentTitle>
  }
}

Forgot.propTypes = {
  intl: React.PropTypes.shape({
    formatMessage: React.PropTypes.func.isRequired
  })
}

module.exports = injectIntl(Forgot)
