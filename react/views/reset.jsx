/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')
const {ValidationForm, ValidationElement} = require('./validation')
const {generateChangeHandler} = require('../../utils/react')

class Reset extends React.Component {

  constructor (props) {
    super(props)
    this.state = {values: {}}
    this.submitHandler = (evt) => {
      const {location: {query: {user, token}}} = this.props
      this.setState({loading: true})
      evt.preventDefault()
      return this.context.actions
        .userResetPassword(user, token, this.state.values.password)
        .then(
          () => this.setState({
            loading: false,
            values: {},
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
          onSubmit={this.submitHandler}
          id='ResetPassword'>
          {this.state.message
            ? <div className={'notion ' + (this.state.message.type || '')}>{this.state.message.message}</div>
            : null}
          <ValidationElement
            initial={this.state.values.password === undefined}
            password trim value={this.state.values.password || ''}>
            <label data-validate-error='Please enter at least 6 characters'>
              <input
                onChange={generateChangeHandler(this, 'password')}
                value={this.state.values.password || ''}
                type='password' name='password' placeholder='New password' data-validate-type='password'/>
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
