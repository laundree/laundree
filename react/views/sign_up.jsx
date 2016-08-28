/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')
const {ValidationForm, ValidationElement} = require('./validation')
const {generateChangeHandler} = require('../../utils/react')

class SignUp extends React.Component {

  constructor (props) {
    super(props)
    this.state = {values: {}}
    this.submitHandler = (evt) => {
      this.setState({loading: true})
      evt.preventDefault()
      if (!this.context.actions.signUpUser) return
      return this.context.actions.signUpUser(
        this.state.values.name,
        this.state.values.email,
        this.state.values.password
      )
        .then(
          () => this.setState({
            loading: false,
            values: {},
            message: {message: 'A verification link has been sent', type: 'success'}
          }),
          (err) => this.setState({
            loading: false,
            message: {message: err.message, type: 'error'}
          }))
    }
  }

  render () {
    return <DocumentTitle title='Sign up'>
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
          <a href='/auth/facebook' className='facebook'>
            <svg>
              <use xlinkHref='#Facebook'/>
            </svg>
            Sign up with Facebook
          </a>
          <a href='/auth/google' className='google'>
            <svg>
              <use xlinkHref='#GooglePlus'/>
            </svg>
            Sign up with Google
          </a>
        </div>
        <div className='or'>
          <span>OR</span>
        </div>
        <ValidationForm
          className={this.state.loading ? 'blur' : ''}
          onSubmit={this.submitHandler}>
          {this.state.message
            ? <div className={'notion ' + (this.state.message.type || '')}>{this.state.message.message}</div>
            : null}
          <ValidationElement
            nonEmpty
            trim
            initial={this.state.values.name === undefined}
            value={this.state.values.name || ''}>
            <label data-validate-error='Please enter your full name'>
              <input
                type='text' name='name' placeholder='Full name'
                value={this.state.values.name || ''}
                onChange={generateChangeHandler(this, 'name')}
              />
            </label>
          </ValidationElement>
          <ValidationElement
            email
            trim
            initial={this.state.values.email === undefined}
            value={this.state.values.email || ''}>
            <label
              data-validate-error='Please enter a valid e-mail address'>
              <input
                value={this.state.values.email || ''}
                onChange={generateChangeHandler(this, 'email')}
                type='text' name='email' placeholder='E-mail address'/>
            </label>
          </ValidationElement>
          <ValidationElement
            initial={this.state.values.password === undefined}
            password
            trim
            value={this.state.values.password || ''}>
            <label data-validate-error='Min. 6 characters containing at least one letter'>
              <input
                value={this.state.values.password || ''}
                onChange={generateChangeHandler(this, 'password')}
                type='password' name='password' placeholder='Password'/>
            </label>
          </ValidationElement>
          <div className='accept'>
            By signing up you agree with our {' '}
            <a href='/terms-and-conditions' target='_blank'>Terms and Conditions</a>{' '}and{' '}
            <a href='/privacy' target='_blank'>Privacy Policy</a>.
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
        </ValidationForm>
      </div>
    </DocumentTitle>
  }
}

SignUp.contextTypes = {
  actions: React.PropTypes.shape({
    userForgotPassword: React.PropTypes.func
  })
}

module.exports = SignUp
