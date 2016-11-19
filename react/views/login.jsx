/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')
const {ValidationForm, ValidationElement} = require('./validation')
const {USER_NOT_VERIFIED} = require('../../utils/flash')
const {ValueUpdater} = require('./helpers')

class LogIn extends ValueUpdater {

  handleNotion () {
    if (!this.props.flash.length) return null
    const {type, message} = this.props.flash[0]
    if (message !== USER_NOT_VERIFIED) return <div className={'notion ' + type}>{message}</div>
    return <div className={`notion ${type}`}>
      The email provided isn't verified. <br />
      Please check your inbox or <br />
      <Link to='/auth/verification'>send a new verification email</Link>.
    </div>
  }

  get query () {
    return this.props.to ? `?to=${encodeURIComponent(this.props.to)}` : ''
  }

  render () {
    return <DocumentTitle title='Login'>
      <div>
        <h1>
          Log in to
        </h1>
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
            Log in with Facebook
          </a>
          <a href={'/auth/google' + this.query} className='google'>
            <svg>
              <use xlinkHref='#GooglePlus'/>
            </svg>
            Log in with Google
          </a>
        </div>
        <div className='or'>
          <span>OR</span>
        </div>
        <ValidationForm id='SignIn' method='post' action={'/auth/local' + this.query}>
          {this.handleNotion()}
          <ValidationElement email trim value={this.state.values.email || ''}>
            <label
              data-validate-error='Please enter a valid e-mail address'>
              <input
                type='text'
                name='username'
                placeholder='E-mail address'
                value={this.state.values.email || ''}
                onChange={this.generateValueUpdater('email')}/>
            </label>
          </ValidationElement>
          <ValidationElement
            value={this.state.values.password || ''}
            nonEmpty trim>
            <label
              data-validate-error='Please enter a password'>
              <input
                type='password' name='password' placeholder='Password'
                value={this.state.values.password || ''}
                onChange={this.generateValueUpdater('password')}/>
            </label>
          </ValidationElement>
          <div className='buttons'>
            <input type='submit' value='Log in'/>
          </div>
          <div className='forgot'>
            <div>
              Forgot your password?{' '}
              <Link to='/auth/forgot' className='forgot'>Let us send you a new one.</Link>
            </div>
            <div>
              Do you not have an account?{' '}
              <Link to={'/auth/sign-up' + this.query}>Sign-up here.</Link>
            </div>
          </div>
        </ValidationForm>
        <div className='notice'>
          Notice: By logging in without an account, we will register you and you will be accepting our{' '}
          <a href='/terms-and-conditions' target='_blank'>Terms and Conditions</a>{' '} and{' '}
          <a href='/privacy' target='_blank'>Privacy Policy</a>.
        </div>
      </div>
    </DocumentTitle>
  }
}

LogIn.propTypes = {
  to: React.PropTypes.string,
  flash: React.PropTypes.arrayOf(React.PropTypes.shape({
    type: React.PropTypes.string.isRequired,
    message: React.PropTypes.string.isRequired
  })).isRequired
}

module.exports = LogIn
