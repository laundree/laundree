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
const {Input, Submit, Label} = require('./intl')

class SignUp extends ValueUpdater {

  constructor (props) {
    super(props)
    this.submitHandler = (evt) => {
      this.setState({loading: true})
      evt.preventDefault()
      return sdk.user.signUpUser(
        this.state.values.name,
        this.state.values.email,
        this.state.values.password
      )
        .then(
          () => this.reset({
            loading: false,
            notion: {message: <FormattedMessage id='auth.signup.success'/>, success: true}
          }),
          err => this.setState({
            loading: false,
            notion: {
              message: <FormattedMessage id={err.status === 409
                ? 'auth.signup.error.already-exists'
                : 'auth.signup.error'}/>
            }
          }))
    }
  }

  get query () {
    return this.props.to ? `?to=${encodeURIComponent(this.props.to)}` : ''
  }

  render () {
    return <DocumentTitle title='document-title.signup'>
      <div>
        <FormattedMessage id='auth.signup.title' tagName='h1'/>
        <Link to='/' id='Logo'>
          <svg>
            <use xlinkHref='#MediaLogo'/>
          </svg>
        </Link>
        <div className='auth_alternatives'>
          <a href={'/auth/facebook' + this.query} className='facebook'>
            <svg>
              <use xlinkHref='#Facebook'/>
            </svg>
            <FormattedMessage id='auth.signup.method.facebook'/>
          </a>
          <a href={'/auth/google' + this.query} className='google'>
            <svg>
              <use xlinkHref='#GooglePlus'/>
            </svg>
            <FormattedMessage id='auth.signup.method.google'/>
          </a>
        </div>
        <div className='or'>
          <FormattedMessage id='general.or'/>
        </div>
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
                onChange={this.generateValueUpdater('name')}
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
                onChange={this.generateValueUpdater('email')}
                type='text' name='email' placeholder='general.email-address'/>
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
                onChange={this.generateValueUpdater('password')}
                type='password' name='password' placeholder='general.password'/>
            </Label>
          </ValidationElement>
          <div className='accept'>
            <FormattedMessage id='auth.signup.notice' values={{
              toc: <a
                href='/terms-and-conditions'
                target='_blank'>
                <FormattedMessage id='general.toc'/>
              </a>,
              pp: <a href='/privacy' target='_blank'>
                <FormattedMessage id='general.privacy-policy'/>
              </a>
            }}/>
          </div>
          <div className='buttons'>
            <Submit
              value='general.create-account'
              className='create'/>
          </div>
          <div className='forgot'>
            <div>
              <FormattedMessage
                id='auth.links.login'
                values={{
                  link: <Link to={'/auth' + this.query}>
                    <FormattedMessage id='auth.links.login.link'/>
                  </Link>
                }}/>
            </div>
            <div>
              <FormattedMessage
                id='auth.links.forgot'
                values={{
                  link: <Link
                    to='/auth/forgot'
                    className='forgot'>
                    <FormattedMessage id='auth.links.forgot.link'/>
                  </Link>
                }}/>
            </div>
          </div>
        </ValidationForm>
      </div>
    </DocumentTitle>
  }
}

module.exports = SignUp
