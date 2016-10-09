const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')
const {ValidationElement, ValidationForm} = require('./validation')
const {ValueUpdater} = require('./helpers')
const sdk = require('../../client/sdk')

class UserNameForm extends ValueUpdater {

  constructor (props) {
    super(props)
    this.onSubmit = (event) => {
      this.setState({loading: true})
      event.preventDefault()
      sdk.user(this.props.user.id)
        .updateName(this.state.values.displayName)
        .then(() => this.setState({loading: false}))
    }
  }

  get initialValues () {
    return {displayName: this.props.user.displayName}
  }

  componentWillReceiveProps ({user: {displayName}}) {
    if (displayName === this.props.user.displayName) return
    this.reset({values: {displayName: displayName}})
  }

  render () {
    return <ValidationForm
      sesh={this.state.sesh}
      onSubmit={this.onSubmit}
      className={this.state.loading ? 'blur' : ''}>
      <ValidationElement
        nonEmpty
        sesh={this.state.sesh}
        trim
        value={this.state.values.displayName || ''}>
        <label>
          <input
            onChange={this.generateValueUpdater('displayName')}
            type='text' value={this.state.values.displayName || ''}/>
        </label>
      </ValidationElement>
      <div className='buttons'>
        <input type='submit' value='Update name'/>
      </div>
    </ValidationForm>
  }
}

UserNameForm.propTypes = {
  user: React.PropTypes.object.isRequired
}

class UserPasswordForm extends ValueUpdater {

  constructor (props) {
    super(props)
    this.onSubmit = (event) => {
      this.setState({loading: true})
      event.preventDefault()
      sdk.user(this.props.user.id)
        .changePassword(
          this.state.values.currentPassword,
          this.state.values.newPassword)
        .then(
          () => this.reset({loading: false, notion: {message: 'Password updated', type: 'success'}}),
          (err) => this.setState({
            loading: false,
            notion: {message: err.status === 403 ? 'Invalid password' : 'Error', type: 'error'}
          }))
    }
  }

  get initialValues () {
    return {
      currentPassword: '',
      newPassword: '',
      newPasswordRepeat: ''
    }
  }

  renderNotion () {
    if (!this.state.notion) return null
    return <div className={`notion ${this.state.notion.type}`}>{this.state.notion.message}</div>
  }

  render () {
    return <ValidationForm
      onSubmit={this.onSubmit}
      className={this.state.loading ? 'blur' : ''}
      sesh={this.state.sesh}>
      {this.renderNotion()}
      <ValidationElement
        password
        value={this.state.values.currentPassword}
        sesh={this.state.sesh}>
        <label data-validate-error='Please enter a valid password'>
          <input
            value={this.state.values.currentPassword}
            onChange={this.generateValueUpdater('currentPassword')}
            type='password' placeholder='Current password'/>
        </label>
      </ValidationElement>
      <ValidationElement
        password
        sesh={this.state.sesh}
        value={this.state.values.newPassword}>
        <label data-validate-error='Please enter a valid password'>
          <input
            value={this.state.values.newPassword}
            onChange={this.generateValueUpdater('newPassword')}
            type='password' placeholder='New password'/>
        </label>
      </ValidationElement>
      <ValidationElement
        equal={this.state.values.newPassword}
        sesh={this.state.sesh}
        value={this.state.values.newPasswordRepeat}>
        <label data-validate-error='Passwords must match'>
          <input
            value={this.state.values.newPasswordRepeat}
            onChange={this.generateValueUpdater('newPasswordRepeat')}
            type='password' placeholder='Repeat password'/>
        </label>
      </ValidationElement>
      <div className='buttons'>
        <input type='submit' value='Change password'/>
      </div>
    </ValidationForm>
  }
}

UserPasswordForm.propTypes = {
  user: React.PropTypes.object.isRequired
}

class Settings extends React.Component {

  render () {
    const user = this.props.users[this.props.currentUser]
    return <DocumentTitle title='Profile settings'>
      <main className='topNaved' id='Settings'>
        <h1>Profile settings</h1>
        <section>
          <h2>Basic user-info</h2>
          <UserNameForm user={user}/>
        </section>
        <section>
          <h2>Change password</h2>
          <UserPasswordForm user={user}/>
        </section>
        <section>
          <h2>Delete account</h2>
          <p>
            Deleting your account is currently a manual process.<br />
            Please contact us at <a href='mailto:delete-my-account@laundre.io'>delete-my-account@laundre.io</a> if you
            which to do so.
          </p>
        </section>
        <section>
          <h2>Laundries</h2>
          {this.renderLaundries(user)}
        </section>
      </main>
    </DocumentTitle>
  }

  renderLaundries (user) {
    if (user.laundries.length === 0) {
      return <div className='emptyLaundryList'>
        No laundry found.
      </div>
    }
    return <ul className='laundryList'>
      {user.laundries.map(id => this.props.laundries[id]).map(laundry =>
        <li key={laundry.id}>
          <Link to={`/laundries/${laundry.id}`}>{laundry.name}</Link>
        </li>)}
    </ul>
  }

}

Settings.propTypes = {
  currentUser: React.PropTypes.string,
  laundries: React.PropTypes.object,
  users: React.PropTypes.object
}

module.exports = Settings
