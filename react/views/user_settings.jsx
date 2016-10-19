const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')
const {ValidationElement, ValidationForm} = require('./validation')
const {ValueUpdater} = require('./helpers')
const sdk = require('../../client/sdk')
const Modal = require('./modal.jsx')

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

class DeleteUser extends React.Component {

  constructor (props) {
    super(props)
    this.state = {modalOpen: false}
    this.handleDeleteClick = () => this.deleteLaundry()
    this.handleCloseModal = () => this.setState({modalOpen: false})
    this.handleOpenModal = () => this.setState({modalOpen: true})
  }

  deleteLaundry () {
    return sdk.user(this.props.user.id).deleteUser().then(() => {
      window.location = '/'
    })
  }

  render () {
    return <div>
      <Modal
        show={this.state.modalOpen}
        onClose={this.handleCloseModal}
        message='Are you absolutely sure that you want to delete your account?'
        actions={[
          {label: 'Yes', className: 'delete red', action: this.handleDeleteClick},
          {label: 'No', action: this.handleCloseModal}
        ]}/>
      <div className='buttonContainer'>
        <button onClick={this.handleOpenModal} className='red'>Delete Account</button>
      </div>
    </div>
  }

}

DeleteUser.propTypes = {
  user: React.PropTypes.object.isRequired
}
class UserSettings extends React.Component {

  constructor (props) {
    super(props)
    this.state = {}
    this.onLoadClick = () => {
      if (this.state.loading) return
      this.setState({loading: true})
      sdk.user(this.props.user).listEmails().then(emails => this.setState({loading: false, emails}))
    }
  }

  renderPassword () {
    if (this.isAdmin && !this.isSelf) return null
    return <section>
      <h2>Change password</h2>
      <UserPasswordForm user={this.user}/>
    </section>
  }

  get isSelf () {
    return this.props.user === this.props.currentUser
  }

  get user () {
    return this.props.users[this.props.user]
  }

  get currentUser () {
    return this.props.users[this.props.currentUser]
  }

  get isAdmin () {
    return this.currentUser.role === 'admin'
  }

  get laundries () {
    return this.user.laundries.map(l => this.props.laundries[l]).filter(l => l)
  }

  get isOwner () {
    return this.laundries.find(l => l.owners.find(i => i === this.props.user))
  }

  renderDelete () {
    if (this.isOwner) {
      return <section>
        <h2>Delete account</h2>
        <div className='text'>
          Since you are a owner of at least one laundry, you cannot delete your account.<br />
          Please delete your laundries first!
        </div>
      </section>
    }
    return <section>
      <h2>Delete account</h2>
      <div className='text'>
        Deleting your account is irreversible and your information will be removed.<br />
        This including, but not limited to, bookings.
        <DeleteUser user={this.user}/>
      </div>
    </section>
  }

  renderEmailList () {
    if (!this.state.emails) {
      return <div className='bigListMessage email'>
        <button className={this.state.loading ? 'grey' : ''} onClick={this.onLoadClick}>
          {this.state.loading ? 'Loading addresses...' : 'Load addresses'}
        </button>
      </div>
    }
    return <ul className='bigList'>
      {this.state.emails.map(email => <li key={email}>
        <div className='name'>
          <a href={`mailto:${email}`}>
            {email}
          </a>
        </div>
      </li>)}
    </ul>
  }

  renderEmails () {
    if (!this.isAdmin && !this.isSelf) return
    return <section>
      <h2>Email addresses</h2>
      <div className='text'>
        {this.renderEmailList()}
      </div>
    </section>
  }

  render () {
    const user = this.user
    return <DocumentTitle title='Profile settings'>
      <main className='topNaved' id='Settings'>
        <h1>Profile settings</h1>
        <section>
          <h2>Basic user-info</h2>
          <UserNameForm user={user}/>
        </section>
        {this.renderEmails()}
        {this.renderPassword()}
        {this.renderDelete()}
        <section>
          <h2>Laundries</h2>
          <div className='text'>
            {this.renderLaundries(user)}
          </div>
        </section>
      </main>
    </DocumentTitle>
  }

  renderLaundries (user) {
    if (user.laundries.length === 0) {
      return <div className='bigListMessage'>
        No laundries found.
      </div>
    }
    return <ul className='bigList'>
      {user.laundries.map(id => this.props.laundries[id]).map(laundry =>
        <li key={laundry.id}>
          <div className='name'>
            <Link to={`/laundries/${laundry.id}`}>{laundry.name}</Link>
          </div>
        </li>)}
    </ul>
  }

}

UserSettings.propTypes = {
  currentUser: React.PropTypes.string,
  user: React.PropTypes.string,
  laundries: React.PropTypes.object,
  users: React.PropTypes.object
}

module.exports = UserSettings
