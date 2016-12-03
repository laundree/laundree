const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')
const {ValidationElement, ValidationForm} = require('./validation')
const {ValueUpdater} = require('./helpers')
const sdk = require('../../client/sdk')
const {Modal, Submit, Input, Label} = require('./intl')
const {FormattedMessage} = require('react-intl')

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
        <Submit value='general.update'/>
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
          () => this.reset({
            loading: false,
            notion: {
              message: <FormattedMessage id='user-settings.change-password.success'/>,
              success: true
            }
          }),
          (err) => this.setState({
            loading: false,
            notion: {
              message: <FormattedMessage id={err.status === 403
                ? 'user-settings.change-password.error.invalid'
                : 'user-settings.change-password.error'}/>
            }
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
        <Label data-validate-error='user-settings.change-password.invalid-password'>
          <Input
            value={this.state.values.currentPassword}
            onChange={this.generateValueUpdater('currentPassword')}
            type='password' placeholder='general.current-password'/>
        </Label>
      </ValidationElement>
      <ValidationElement
        password
        sesh={this.state.sesh}
        value={this.state.values.newPassword}>
        <Label data-validate-error='user-settings.change-password.invalid-password'>
          <Input
            value={this.state.values.newPassword}
            onChange={this.generateValueUpdater('newPassword')}
            type='password' placeholder='general.new-password'/>
        </Label>
      </ValidationElement>
      <ValidationElement
        equal={this.state.values.newPassword}
        sesh={this.state.sesh}
        value={this.state.values.newPasswordRepeat}>
        <Label data-validate-error='user-settings.change-password.password-match'>
          <Input
            value={this.state.values.newPasswordRepeat}
            onChange={this.generateValueUpdater('newPasswordRepeat')}
            type='password' placeholder='general.repeat-password'/>
        </Label>
      </ValidationElement>
      <div className='buttons'>
        <Submit value='general.change-password'/>
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
    this.handleDeleteClick = () => this.deleteUser()
    this.handleCloseModal = () => this.setState({modalOpen: false})
    this.handleOpenModal = () => this.setState({modalOpen: true})
  }

  deleteUser () {
    return sdk.user(this.props.user.id).del().then(() => {
      window.location = '/'
    })
  }

  render () {
    return <div>
      <Modal
        show={this.state.modalOpen}
        onClose={this.handleCloseModal}
        message='user-settings.delete-account.modal.message'
        actions={[
          {label: 'general.yes', className: 'delete red', action: this.handleDeleteClick},
          {label: 'general.no', action: this.handleCloseModal}
        ]}/>
      <div className='buttonContainer'>
        <button onClick={this.handleOpenModal} className='red'>
          <FormattedMessage id='general.delete-account'/>
        </button>
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
      <FormattedMessage id='user-settings.change-password.title' tagName='h2'/>
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
    return <section>
      <FormattedMessage id='user-settings.delete-account.title' tagName='h2'/>
      {this.renderDeleteText()}
    </section>
  }

  renderDeleteText () {
    if (this.isOwner) {
      return <div className='text'>
        <FormattedMessage
          values={{nl: <br />}}
          id='user-settings.delete-account.message.owner'/>
      </div>
    }
    return <div className='text'>
      <FormattedMessage
        values={{nl: <br />}}
        id='user-settings.delete-account.message.user'/>
      <DeleteUser user={this.user}/>
    </div>
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
      <FormattedMessage id='user-settings.email-addresses.title' tagName='h2'/>
      <div className='text'>
        {this.renderEmailList()}
      </div>
    </section>
  }

  render () {
    const user = this.user
    return <DocumentTitle title='Profile settings'>
      <main className='topNaved' id='Settings'>
        <FormattedMessage tagName='h1' id='user-settings.title'/>
        <section>
          <FormattedMessage tagName='h2' id='user-settings.basic-info.title'/>
          <UserNameForm user={user}/>
        </section>
        {this.renderEmails()}
        {this.renderPassword()}
        {this.renderDelete()}
        <section>
          <FormattedMessage tagName='h2' id='user-settings.laundries.title'/>
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
        <FormattedMessage id='user-settings.laundries.no-laundries'/>
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
