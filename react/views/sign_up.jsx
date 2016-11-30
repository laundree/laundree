/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('./document-title-intl.jsx')
const {Link} = require('react-router')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const sdk = require('../../client/sdk')
const {injectIntl, FormattedMessage} = require('react-intl')

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
            message: {message: 'auth.signup.success', type: 'success'}
          }),
          err => this.setState({
            loading: false,
            message: {
              message: err.status === 409
                ? 'auth.signup.error.already-exists'
                : 'auth.signup.error',
              type: 'error'
            }
          }))
    }
  }

  get query () {
    return this.props.to ? `?to=${encodeURIComponent(this.props.to)}` : ''
  }

  renderMessage () {
    if (!this.state.message) return null
    return <div className={'notion ' + (this.state.message.type || '')}>
      <FormattedMessage id={this.state.message.message}/>
    </div>
  }

  render () {
    return <DocumentTitle id='document-title.signup'>
      <div>
        <FormattedMessage id='auth.signup.title' tagName='h1'/>
        <Link to='/' id='Logo'>
          <svg>
            <use xlinkHref='#Logo'/>
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
          {this.renderMessage()}
          <ValidationElement
            nonEmpty
            trim sesh={this.state.sesh}
            initial={this.state.values.name === undefined}
            value={this.state.values.name || ''}>
            <label data-validate-error={this.props.intl.formatMessage({id: 'auth.error.no-full-name'})}>
              <input
                type='text' name='name' placeholder={this.props.intl.formatMessage({id: 'general.full-name'})}
                value={this.state.values.name || ''}
                onChange={this.generateValueUpdater('name')}
              />
            </label>
          </ValidationElement>
          <ValidationElement
            email
            trim sesh={this.state.sesh}
            initial={this.state.values.email === undefined}
            value={this.state.values.email || ''}>
            <label
              data-validate-error={this.props.intl.formatMessage({id: 'auth.error.invalid-email'})}>
              <input
                value={this.state.values.email || ''}
                onChange={this.generateValueUpdater('email')}
                type='text' name='email' placeholder={this.props.intl.formatMessage({id: 'general.email-address'})}/>
            </label>
          </ValidationElement>
          <ValidationElement
            initial={this.state.values.password === undefined}
            password
            trim sesh={this.state.sesh}
            value={this.state.values.password || ''}>
            <label data-validate-error={this.props.intl.formatMessage({id: 'auth.error.invalid-password'})}>
              <input
                value={this.state.values.password || ''}
                onChange={this.generateValueUpdater('password')}
                type='password' name='password' placeholder={this.props.intl.formatMessage({id: 'general.password'})}/>
            </label>
          </ValidationElement>
          <div className='accept'>
            <FormattedMessage id='auth.signup.notice' values={{
              toc: <a
                href='/terms-and-conditions'
                target='_blank'>{this.props.intl.formatMessage({id: 'general.toc'})}</a>,
              pp: <a href='/privacy' target='_blank'>{this.props.intl.formatMessage({id: 'general.privacy-policy'})}</a>
            }}/>
          </div>
          <div className='buttons'>
            <input
              type='submit' value={this.props.intl.formatMessage({id: 'general.create-account'})}
              className='create'/>
          </div>
          <div className='forgot'>
            <div>
              <FormattedMessage
                id='auth.links.login'
                values={{
                  link: <Link to={'/auth' + this.query}>
                    {this.props.intl.formatMessage({id: 'auth.links.login.link'})}
                  </Link>
                }}/>
            </div>
            <div>
              <FormattedMessage
                id='auth.links.forgot'
                values={{
                  link: <Link
                    to='/auth/forgot'
                    className='forgot'>{this.props.intl.formatMessage({id: 'auth.links.forgot.link'})}</Link>
                }}/>
            </div>
          </div>
        </ValidationForm>
      </div>
    </DocumentTitle>
  }
}

SignUp.propTypes = {
  intl: React.PropTypes.shape({
    formatMessage: React.PropTypes.func.isRequired
  })
}

module.exports = injectIntl(SignUp)
