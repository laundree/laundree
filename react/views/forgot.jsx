/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')

const Forgot = () => <DocumentTitle title='Login'>
  <div>
    <h1>
      Reset your password
    </h1>
    <Link to='/' id='Logo'>
      <svg>
        <use xlinkHref='#Logo'/>
      </svg>
    </Link>
    <form id='ForgotPassword' className='validate initial'>
      <label className='validate' data-validate-error='Please enter your e-mail address.'>
        <input type='text' name='email' placeholder='E-mail address' data-validate-type='email'/>
      </label>
      <div className='buttons'>
        <input type='submit' value='Reset'/>
      </div>
      <div className='forgot'>
        <div>
          Did you remember your password?{' '}
          <Link to='/auth' className='forgot'>Log in.</Link>
        </div>
        <div>
          Do you not have an account?{' '}
          <Link to='/auth/sign-up'>Sign-up here.</Link>
        </div>
      </div>
    </form>
  </div>
</DocumentTitle>

module.exports = Forgot
