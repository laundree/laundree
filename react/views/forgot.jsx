/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const {DocumentTitle} = require('./intl')
const {Link} = require('react-router')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const sdk = require('../../client/sdk')
const {FormattedMessage} = require('react-intl')
const {Input, Label, Submit} = require('./intl')

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
              notion: {
                message: <FormattedMessage id='auth.forgot.success'/>,
                success: true
              }
            }),
          () => this.setState({
            loading: false,
            notion: {
              message: <FormattedMessage id='auth.forgot.error'/>,
              success: false
            }
          }))
    }
  }

  render () {
    return <DocumentTitle title='document-title.resend-verification'>
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
          {this.renderNotion()}
          <ValidationElement
            email
            trim
            sesh={this.state.sesh}
            value={this.state.values.email || ''}>
            <Label data-validate-error='auth.error.no-email'>
              <Input
                onChange={this.generateValueUpdater('email')}
                value={this.state.values.email || ''}
                type='text' name='email'
                placeholder='general.email-address'/>
            </Label>
          </ValidationElement>
          <div className='buttons'>
            <Submit value='general.reset'/>
          </div>
          <div className='forgot'>
            <div>
              <FormattedMessage
                id='auth.links.login3'
                values={{
                  link: <Link to='/auth'>
                    <FormattedMessage id='auth.links.login3.link'/>
                  </Link>
                }}/>
            </div>
            <div>
              <FormattedMessage
                id='auth.links.signup'
                values={{
                  link: <Link
                    to='/auth/sign-up'
                    className='forgot'>
                    <FormattedMessage id='auth.links.signup.link'/>
                  </Link>
                }}/>
            </div>
          </div>
        </ValidationForm>
      </div>
    </DocumentTitle>
  }
}

module.exports = Forgot
