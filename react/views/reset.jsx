/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')

class Reset extends ValueUpdater {

  constructor (props) {
    super(props)
    this.submitHandler = (evt) => {
      const {location: {query: {user, token}}} = this.props
      this.setState({loading: true})
      evt.preventDefault()
      return this.context.actions
        .userResetPassword(user, token, this.state.values.password)
        .then(
          () => this.reset({
            loading: false,
            message: {message: 'Your password has been reset', type: 'success'}
          }),
          () => this.setState({
            loading: false,
            message: {message: 'Something went wrong', type: 'error'}
          }))
    }
  }

  render () {
    return <DocumentTitle title='Reset password'>
      <div>
        <h1>
          Reset your password
        </h1>
        <Link to='/' id='Logo'>
          <svg>
            <use xlinkHref='#Logo'/>
          </svg>
        </Link>
        <ValidationForm
          sesh={this.state.sesh}
          onSubmit={this.submitHandler}
          id='ResetPassword'>
          {this.state.message
            ? <div className={'notion ' + (this.state.message.type || '')}>{this.state.message.message}</div>
            : null}
          <ValidationElement
            sesh={this.state.sesh}
            password trim value={this.state.values.password || ''}>
            <label data-validate-error='Please enter at least 6 characters'>
              <input
                onChange={this.generateValueUpdater('password')}
                value={this.state.values.password || ''}
                type='password' name='password' placeholder='New password'/>
            </label>
          </ValidationElement>
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
        </ValidationForm>
      </div>
    </DocumentTitle>
  }
}

Reset.contextTypes = {
  actions: React.PropTypes.shape({
    userResetPassword: React.PropTypes.func
  })
}

Reset.propTypes = {
  location: React.PropTypes.shape({
    query: React.PropTypes.shape({
      user: React.PropTypes.string,
      token: React.PropTypes.string
    })
  })
}

module.exports = Reset
