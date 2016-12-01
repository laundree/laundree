/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('./document-title-intl.jsx')
const {Link} = require('react-router')
const {ValidationForm, ValidationElement} = require('./validation')
const {USER_NOT_VERIFIED} = require('../../utils/flash')
const {ValueUpdater} = require('./helpers')
const {injectIntl, FormattedMessage} = require('react-intl')

class LogIn extends ValueUpdater {

  handleNotion () {
    if (!this.props.flash.length) return null
    const {type, message} = this.props.flash[0]
    if (message !== USER_NOT_VERIFIED) return <div className={'notion ' + type}>{message}</div>
    return <div className={`notion ${type}`}>
      <FormattedMessage
        id='auth.error.not-verified'
        values={{
          link: <Link to='/auth/verification'><FormattedMessage id='auth.error.not-verified.link'/></Link>
        }}/>
    </div>
  }

  get query () {
    return this.props.to ? `?to=${encodeURIComponent(this.props.to)}` : ''
  }

  render () {
    return <DocumentTitle id='document-title.login'>
      <div>
        <FormattedMessage tagName='h1' id='auth.login.title'/>
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
            <FormattedMessage id='auth.login.method.facebook'/>
          </a>
          <a href={'/auth/google' + this.query} className='google'>
            <svg>
              <use xlinkHref='#GooglePlus'/>
            </svg>
            <FormattedMessage id='auth.login.method.google'/>
          </a>
        </div>
        <div className='or'>
          <FormattedMessage id='general.or'/>
        </div>
        <ValidationForm id='SignIn' method='post' action={'/auth/local' + this.query}>
          {this.handleNotion()}
          <ValidationElement email trim value={this.state.values.email || ''}>
            <label
              data-validate-error={this.props.intl.formatMessage({id: 'auth.error.invalid-email'})}>
              <input
                type='text'
                name='username'
                placeholder={this.props.intl.formatMessage({id: 'general.email-address'})}
                value={this.state.values.email || ''}
                onChange={this.generateValueUpdater('email')}/>
            </label>
          </ValidationElement>
          <ValidationElement
            value={this.state.values.password || ''}
            nonEmpty trim>
            <label
              data-validate-error={this.props.intl.formatMessage({id: 'auth.error.no-password'})}>
              <input
                type='password' name='password' placeholder={this.props.intl.formatMessage({id: 'general.password'})}
                value={this.state.values.password || ''}
                onChange={this.generateValueUpdater('password')}/>
            </label>
          </ValidationElement>
          <div className='buttons'>
            <input type='submit' value='Log in'/>
          </div>
          <div className='forgot'>
            <div>
              <FormattedMessage
                id='auth.links.forgot'
                values={{
                  link: <Link
                    to='/auth/forgot'
                    className='forgot'>{this.props.intl.formatMessage({id: 'auth.links.forgot.link'})}</Link>
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
        <div className='notice'>
          <FormattedMessage id='auth.login.notice' values={{
            toc: <a
              href='/terms-and-conditions'
              target='_blank'>{this.props.intl.formatMessage({id: 'general.toc'})}</a>,
            pp: <a href='/privacy' target='_blank'>{this.props.intl.formatMessage({id: 'general.privacy-policy'})}</a>
          }}/>
        </div>
      </div>
    </DocumentTitle>
  }
}

LogIn.propTypes = {
  intl: React.PropTypes.shape({
    formatMessage: React.PropTypes.func.isRequired
  }),
  to: React.PropTypes.string,
  flash: React.PropTypes.arrayOf(React.PropTypes.shape({
    type: React.PropTypes.string.isRequired,
    message: React.PropTypes.string.isRequired
  })).isRequired
}

module.exports = injectIntl(LogIn)
