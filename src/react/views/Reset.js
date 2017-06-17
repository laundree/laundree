/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const {Link} = require('react-router-dom')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const sdk = require('../../client/sdk')
const {DocumentTitle, Input, Submit, Label} = require('./intl')
const {FormattedMessage} = require('react-intl')
const queryString = require('querystring')

class Reset extends ValueUpdater {
  constructor (props) {
    super(props)
    this.submitHandler = (evt) => {
      const search = props.location.search && props.location.search.substr(1)
      const {user, token} = queryString.parse(search)
      this.setState({loading: true})
      evt.preventDefault()
      return sdk.user(user)
        .resetPassword(token, this.state.values.password)
        .then(
          () => this.reset({
            loading: false,
            notion: {message: <FormattedMessage id='auth.reset.success' />, success: true}
          }),
          () => this.setState({
            loading: false,
            notion: {message: <FormattedMessage id='auth.reset.error' />, success: false}
          }))
    }
  }

  render () {
    return <DocumentTitle title='document-title.reset-password'>
      <div>
        <h1>
          Reset your password
        </h1>
        <Link to='/' id='Logo'>
          <svg>
            <use xlinkHref='#MediaLogo' />
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
                type='password' name='password' placeholder='general.new-password' />
            </Label>
          </ValidationElement>
          <div className='buttons'>
            <Submit value='general.reset' />
          </div>
          <div className='forgot'>
            <div>
              <FormattedMessage
                id='auth.links.login3'
                values={{
                  link: <Link to='/auth'>
                    <FormattedMessage id='auth.links.login3.link' />
                  </Link>
                }} />
            </div>
            <div>
              <FormattedMessage
                id='auth.links.signup'
                values={{
                  link: <Link
                    to='/auth/sign-up'
                    className='forgot'>
                    <FormattedMessage id='auth.links.signup.link' />
                  </Link>
                }} />
            </div>
          </div>
        </ValidationForm>
      </div>
    </DocumentTitle>
  }
}

Reset.propTypes = {
  location: React.PropTypes.shape({
    search: React.PropTypes.string
  })
}

module.exports = Reset
