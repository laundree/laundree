/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')

const LogIn = () => <DocumentTitle title='Login'>
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
      <a href='/auth/facebook' className='facebook'>
        <svg>
          <use xlinkHref='#Facebook'/>
        </svg>
        Log in with Facebook
      </a>
      <a href='/auth/google' className='google'>
        <svg>
          <use xlinkHref='#GooglePlus'/>
        </svg>
        Log in with Google
      </a>
    </div>
    <div className='or'>
      <span>OR</span>
    </div>
    <form id='SignIn' className='validate initial' method='post' action='/auth/local'>
      <label className='validate' data-validate-error='Please enter your e-mail address.'>
        <input type='text' name='username' placeholder='E-mail address' data-validate-type='email'/>
      </label>
      <label data-validate-error='Please enter your password' className='validate'>
        <input type='password' name='password' placeholder='Password' data-validate-type='nonEmpty'/>
      </label>
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
          <Link to='/auth/sign-up'>Sign-up here.</Link>
        </div>
      </div>
    </form>
    <div className='notice'>
      Notice: By logging in without an account, we will register you and you will be accepting our{' '}
      <a href='/auth/terms-and-conditions' target='_blank'>Terms and Conditions</a>,{' '}
      <a href='/auth/cookie-policy' target='_blank'>Cookie Policy</a>, and{' '}
      <a href='/auth/privacy-policy' target='_blank'>Privacy Policy</a>.
    </div>
  </div>
</DocumentTitle>

module.exports = LogIn
