/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')
const {ValidationForm, ValidationElement} = require('./validation')

class LogIn extends React.Component {

  constructor (props) {
    super(props)
    this.state = {values: {}}
  }

  generateChangeHandler (name) {
    return (evt) => {
      const value = evt.target.value
      this.setState((prevState) => {
        const obj = {}
        obj[name] = value
        return {values: Object.assign({}, prevState.values, obj)}
      })
    }
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
        <ValidationForm id='SignIn' method='post' action='/auth/local'>
          <ValidationElement email trim value={this.state.values.email || ''}>
            <label >
              <input
                type='text'
                name='username'
                placeholder='E-mail address'
                value={this.state.values.email || ''}
                onChange={this.generateChangeHandler('email')}/>
            </label>
          </ValidationElement>
          <ValidationElement
            value={this.state.values.password || ''}
            nonEmpty trim>
            <label >
              <input
                type='password' name='password' placeholder='Password'
                value={this.state.values.password || ''}
                onChange={this.generateChangeHandler('password')}/>
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
              <Link to='/auth/sign-up'>Sign-up here.</Link>
            </div>
          </div>
        </ValidationForm>
        <div className='notice'>
          Notice: By logging in without an account, we will register you and you will be accepting our{' '}
          <a href='/auth/terms-and-conditions' target='_blank'>Terms and Conditions</a>,{' '}
          <a href='/auth/cookie-policy' target='_blank'>Cookie Policy</a>, and{' '}
          <a href='/auth/privacy-policy' target='_blank'>Privacy Policy</a>.
        </div>
      </div>
    </DocumentTitle>
  }
}
module.exports = LogIn
