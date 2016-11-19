/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const sdk = require('../../client/sdk')

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
            message: {message: 'A verification link has been sent', type: 'success'}
          }),
          (err) => this.setState({
            loading: false,
            message: {message: err.message, type: 'error'}
          }))
    }
  }

  get query () {
    return this.props.to ? `?to=${encodeURIComponent(this.props.to)}` : ''
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
          <a href={'/auth/facebook' + this.query} className='facebook'>
            <svg>
              <use xlinkHref='#Facebook'/>
            </svg>
            Sign up with Facebook
          </a>
          <a href={'/auth/google' + this.query} className='google'>
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
          sesh={this.state.sesh}
          className={this.state.loading ? 'blur' : ''}
          onSubmit={this.submitHandler}>
          {this.state.message
            ? <div className={'notion ' + (this.state.message.type || '')}>{this.state.message.message}</div>
            : null}
          <ValidationElement
            nonEmpty
            trim sesh={this.state.sesh}
            initial={this.state.values.name === undefined}
            value={this.state.values.name || ''}>
            <label data-validate-error='Please enter your full name'>
              <input
                type='text' name='name' placeholder='Full name'
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
              data-validate-error='Please enter a valid e-mail address'>
              <input
                value={this.state.values.email || ''}
                onChange={this.generateValueUpdater('email')}
                type='text' name='email' placeholder='E-mail address'/>
            </label>
          </ValidationElement>
          <ValidationElement
            initial={this.state.values.password === undefined}
            password
            trim sesh={this.state.sesh}
            value={this.state.values.password || ''}>
            <label data-validate-error='Min. 6 characters containing at least one letter'>
              <input
                value={this.state.values.password || ''}
                onChange={this.generateValueUpdater('password')}
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
            <div>Already have an account? <Link to={'/auth' + this.query}>Log in here.</Link></div>
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

module.exports = SignUp
