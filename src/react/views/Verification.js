/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const {DocumentTitle} = require('./intl')
const {Link} = require('react-router-dom')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const sdk = require('../../client/sdk')
const {Label, Input, Submit} = require('./intl')
const {FormattedMessage} = require('react-intl')

class Verification extends ValueUpdater {
  constructor (props) {
    super(props)
    this.submitHandler = (evt) => {
      this.setState({loading: true})
      evt.preventDefault()
      return sdk.user.startEmailVerification(this.state.values.email)
        .then(
          () => this.reset({
            loading: false,
            notion: {message: <FormattedMessage id='auth.verification.success' />, success: true}
          }),
          () => this.setState({
            loading: false,
            notion: {message: <FormattedMessage id='auth.verification.error' />}
          }))
    }
  }

  render () {
    return <DocumentTitle title='document-title.resend-verification'>
      <div>
        <FormattedMessage id='auth.verification.title' tagName='h1' />
        <Link to='/' id='Logo'>
          <svg>
            <use xlinkHref='#MediaLogo' />
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
            <Label
              data-validate-error='auth.error.no-email'>
              <Input
                onChange={this.generateValueUpdater('email')}
                value={this.state.values.email || ''}
                type='text' name='email'
                placeholder='general.email-address'
                data-validate-type='email' />
            </Label>
          </ValidationElement>
          <div className='buttons'>
            <Submit value='general.send-again' />
          </div>
          <div className='forgot'>
            <div>
              <FormattedMessage
                id='auth.links.login2'
                values={{
                  link: <Link to={'/auth' + this.query}>
                    <FormattedMessage id='auth.links.login2.link' />
                  </Link>
                }} />
            </div>
            <div>
              <FormattedMessage
                id='auth.links.signup'
                values={{
                  link: <Link
                    to='/auth/sign-up'
                    className='forgot'>
                    <FormattedMessage id='auth.links.signup.link' />
                  </Link>
                }} />
            </div>
          </div>
        </ValidationForm>
      </div>
    </DocumentTitle>
  }
}

Verification.propTypes = {
  intl: React.PropTypes.shape({
    formatMessage: React.PropTypes.func.isRequired
  })
}

module.exports = Verification
