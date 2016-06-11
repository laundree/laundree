/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')

const LogIn = () => <DocumentTitle title='Sign up'>
  <div>
    <h1>
      Sign-up for an account
    </h1>
    <Link to='/' id='Logo'>
      <svg>
        <use xlinkHref='#Logo'/>
      </svg>
    </Link>
    <div className='auth_alternatives'>
      <a href='/auth/facebook{{#if facebook_auth_failure}}?rerequest=1{{/if}}' className='facebook'>
        <svg>
          <use xlinkHref='#Facebook'></use>
        </svg>
        Sign up with Facebook
      </a>
      <a href='/auth/google' className='google'>
        <svg>
          <use xlinkHref='#GooglePlus'></use>
        </svg>
        Sign up with Google
      </a>
    </div>
    <div className='or'>
      <span>OR</span>
    </div>
    <form className='validate initial'>
      <label data-validate-error='Please enter your full name' className='validate'>
        <input type='text' name='name' placeholder='Full name' data-validate-type='nonEmpty'/>
      </label>
      <label
        data-validate-error-email='Please enter a valid e-mail address'
        data-validate-error-email-available='This email is already registered'
        className='validate'>
        <input type='text' name='email' placeholder='E-mail address' data-validate-type='email and emailAvailable'/>
      </label>
      <label data-validate-error='Min. 6 characters containing at least one letter' className='validate'>
        <input type='password' name='password' placeholder='Password' data-validate-type='password'/>
      </label>
      <div className='accept'>
        By signing up you agree with our {' '}
        <a href='/auth/terms-and-conditions' target='_blank'>Terms and Conditions</a>,{' '}
        <a href='/auth/cookie-policy' target='_blank'>Cookie Policy</a>, and{' '}
        <a href='/auth/privacy-policy' target='_blank'>Privacy Policy</a>.
      </div>
      <div className='buttons'>
        <input type='submit' value='Create your account' className='create'/>
      </div>
      <div className='forgot'>
        <div>Already have an account? <Link to='/auth'>Log in here.</Link></div>
        <div>
          Forgot your password?
          <Link to='/auth/forgot' className='forgot'>Let us send you a new one.</Link>
        </div>
      </div>
    </form>
  </div>
</DocumentTitle>

module.exports = LogIn
