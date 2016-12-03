/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const sdk = require('../../client/sdk')
const {Input, Submit, Label} = require('./intl')
const {FormattedMessage} = require('react-intl')

class Reset extends ValueUpdater {

  constructor (props) {
    super(props)
    this.submitHandler = (evt) => {
      const {location: {query: {user, token}}} = this.props
      this.setState({loading: true})
      evt.preventDefault()
      return sdk.user(user).resetPassword(token, this.state.values.password)
        .then(
          () => this.reset({
            loading: false,
            message: {message: <FormattedMessage id='auth.reset.success'/>, success: true}
          }),
          () => this.setState({
            loading: false,
            message: {message: <FormattedMessage id='auth.reset.error'/>, success: false}
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
          {this.renderNotion()}
          <ValidationElement
            sesh={this.state.sesh}
            password trim value={this.state.values.password || ''}>
            <Label data-validate-error='auth.error.invalid-password'>
              <Input
                onChange={this.generateValueUpdater('password')}
                value={this.state.values.password || ''}
                type='password' name='password' placeholder='general.new-password'/>
            </Label>
          </ValidationElement>
          <div className='buttons'>
            <Submit value='general.reset'/>
          </div>
          <div className='forgot'>
            <div>
              <FormattedMessage
                id='auth.links.login3'
                values={{
                  link: <Link to='/auth'>
                    <FormattedMessage id='auth.links.login3.link'/>
                  </Link>
                }}/>
            </div>
            <div>
              <FormattedMessage
                id='auth.links.signup'
                values={{
                  link: <Link
                    to='/auth/sign-up'
                    className='forgot'>
                    <FormattedMessage id='auth.links.signup.link'/>
                  </Link>
                }}/>
            </div>
          </div>
        </ValidationForm>
      </div>
    </DocumentTitle>
  }
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
