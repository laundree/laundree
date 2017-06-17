/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const {DocumentTitle, Input, Submit, Label} = require('./intl')
const {Link} = require('react-router-dom')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const {FormattedMessage} = require('react-intl')

class Login extends ValueUpdater {
  handleNotion () {
    if (!this.props.flash.length) return null
    const {type, message} = this.props.flash[0]
    return <div className={`notion ${type}`}>
      <FormattedMessage
        id={message}
        values={{
          link: <Link to='/auth/verification'><FormattedMessage id='auth.error.not-verified.link' /></Link>
        }} />
    </div>
  }

  get query () {
    return this.props.to ? `?to=${encodeURIComponent(this.props.to)}` : ''
  }

  render () {
    return <DocumentTitle title='document-title.login'>
      <div>
        <FormattedMessage tagName='h1' id='auth.login.title' />
        <Link to='/' id='Logo'>
          <svg>
            <use xlinkHref='#MediaLogo' />
          </svg>
        </Link>
        <div className='auth_alternatives'>
          <a href={'/auth/facebook' + this.query} className='facebook'>
            <svg>
              <use xlinkHref='#Facebook' />
            </svg>
            <FormattedMessage id='auth.login.method.facebook' />
          </a>
          <a href={'/auth/google' + this.query} className='google'>
            <svg>
              <use xlinkHref='#GooglePlus' />
            </svg>
            <FormattedMessage id='auth.login.method.google' />
          </a>
        </div>
        <div className='or'>
          <FormattedMessage id='general.or' />
        </div>
        <ValidationForm id='SignIn' method='post' action={'/auth/local' + this.query}>
          {this.handleNotion()}
          <ValidationElement email trim value={this.state.values.email || ''}>
            <Label
              data-validate-error='auth.error.invalid-email'>
              <Input
                type='text'
                name='username'
                placeholder='general.email-address'
                value={this.state.values.email || ''}
                onChange={this.generateValueUpdater('email')} />
            </Label>
          </ValidationElement>
          <ValidationElement
            value={this.state.values.password || ''}
            nonEmpty trim>
            <Label
              data-validate-error='auth.error.no-password'>
              <Input
                type='password' name='password' placeholder='general.password'
                value={this.state.values.password || ''}
                onChange={this.generateValueUpdater('password')} />
            </Label>
          </ValidationElement>
          <div className='buttons'>
            <Submit value='general.login' />
          </div>
          <div className='forgot'>
            <div>
              <FormattedMessage
                id='auth.links.forgot'
                values={{
                  link: <Link
                    to='/auth/forgot'
                    className='forgot'>
                    <FormattedMessage id='auth.links.forgot.link' />
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
        <div className='notice'>
          <FormattedMessage id='auth.login.notice' values={{
            toc: <a
              href='/terms-and-conditions'
              target='_blank'>
              <FormattedMessage id='general.toc' />
            </a>,
            pp: <a href='/privacy' target='_blank'>
              <FormattedMessage id='general.privacy-policy' />
            </a>
          }} />
        </div>
      </div>
    </DocumentTitle>
  }
}

Login.propTypes = {
  to: React.PropTypes.string,
  flash: React.PropTypes.arrayOf(React.PropTypes.shape({
    type: React.PropTypes.string.isRequired,
    message: React.PropTypes.string.isRequired
  })).isRequired
}

module.exports = Login
