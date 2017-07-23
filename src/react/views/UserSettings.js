// @flow
import React from 'react'
import { Link } from 'react-router-dom'
import { ValidationElement, ValidationForm } from './validation'
import ValueUpdater from './helpers/ValueUpdater'
import sdk from '../../client/sdk'
import { DocumentTitle, Modal, Submit, Input, Label } from './intl'
import { FormattedMessage } from 'react-intl'
import Loader from './Loader'
import NotFound from './NotFound'
import type { User, Laundry } from 'laundree-sdk/lib/redux'

class UserNameForm extends ValueUpdater<{ displayName: string }, { user: User }, { loading: boolean }> {
  onSubmit = async (event) => {
    this.setState({loading: true})
    event.preventDefault()
    await sdk.api.user.updateUser(this.props.user.id, {displayName: this.state.values.displayName})
    this.setState({loading: false})
  }

  initialState () {
    return {loading: false}
  }

  initialValues () {
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
        value={this.state.values.displayName}>
        <label>
          <input
            onChange={this.generateValueEventUpdater(displayName => ({displayName}))}
            type='text' value={this.state.values.displayName}/>
        </label>
      </ValidationElement>
      <div className='buttons'>
        <Submit value='general.update'/>
      </div>
    </ValidationForm>
  }
}

class UserPasswordForm extends ValueUpdater<{ currentPassword: string, newPassword: string, newPasswordRepeat: string }, { user: User }, { loading: boolean }> {

  onSubmit = async (event) => {
    this.setState({loading: true})
    event.preventDefault()
    try {
      await sdk.api.user
        .changePassword(this.props.user.id, {
          currentPassword: this.state.values.currentPassword,
          newPassword: this.state.values.newPassword
        })
      this.reset({
        loading: false,
        notion: {
          message: <FormattedMessage id='user-settings.change-password.success'/>,
          success: true
        }
      })
    } catch (err) {
      this.setState({
        loading: false,
        notion: {
          success: false,
          message: <FormattedMessage id={err.status === 403
            ? 'user-settings.change-password.error.invalid'
            : 'user-settings.change-password.error'}/>
        }
      })
    }
  }

  initialValues () {
    return {
      currentPassword: '',
      newPassword: '',
      newPasswordRepeat: ''
    }
  }

  initialState () {
    return {loading: false}
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
            onChange={this.generateValueEventUpdater(currentPassword => ({currentPassword}))}
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
            onChange={this.generateValueEventUpdater(newPassword => ({newPassword}))}
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
            onChange={this.generateValueEventUpdater(newPasswordRepeat => ({newPasswordRepeat}))}
            type='password' placeholder='general.repeat-password'/>
        </Label>
      </ValidationElement>
      <div className='buttons'>
        <Submit value='general.change-password'/>
      </div>
    </ValidationForm>
  }
}

class DeleteUser extends React.Component {
  state = {modalOpen: false}
  props: { user: User }
  handleDeleteClick = () => this.deleteUser()
  handleCloseModal = () => this.setState({modalOpen: false})
  handleOpenModal = () => this.setState({modalOpen: true})

  async deleteUser () {
    await sdk.api.user.del(this.props.user.id)
    window.location = '/'
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

type UserSettingsProps = {
  currentUser: string,
  user: string,
  laundries: { [string]: Laundry },
  users: { [string]: User }
}

class UserSettings extends React.Component {

  props: UserSettingsProps
  state = {}
  onLoadClick = async () => {
    if (this.state.loading) return
    this.setState({loading: true})
    const emails = await sdk.api.user.listEmails(this.props.user)
    this.setState({loading: false, emails})
  }

  renderPassword () {
    if (this.isAdmin() && !this.isSelf()) return null
    return <section>
      <FormattedMessage id='user-settings.change-password.title' tagName='h2'/>
      <UserPasswordForm user={this.user()}/>
    </section>
  }

  isSelf () {
    return this.props.user === this.props.currentUser
  }

  user () {
    return this.props.users[this.props.user]
  }

  currentUser () {
    return this.props.users[this.props.currentUser]
  }

  isAdmin () {
    return this.currentUser().role === 'admin'
  }

  laundries () {
    return this.user().laundries.map(l => this.props.laundries[l]).filter(l => l)
  }

  isOwner () {
    return this.laundries().find(l => l.owners.find(i => i === this.props.user))
  }

  renderDelete () {
    return <section>
      <FormattedMessage id='user-settings.delete-account.title' tagName='h2'/>
      {this.renderDeleteText()}
    </section>
  }

  renderDeleteText () {
    if (this.isOwner()) {
      return <div className='text'>
        <FormattedMessage
          values={{nl: <br/>}}
          id='user-settings.delete-account.message.owner'/>
      </div>
    }
    return <div className='text'>
      <FormattedMessage
        values={{nl: <br/>}}
        id='user-settings.delete-account.message.user'/>
      <DeleteUser user={this.user()}/>
    </div>
  }

  renderEmailList () {
    if (!this.state.emails) {
      return <div className='bigListMessage email'>
        <button className={this.state.loading ? 'grey' : ''} onClick={this.onLoadClick}>
          <FormattedMessage
            id={this.state.loading ? 'user-settings.email-addresses.loading' : 'user-settings.email-addresses.load'}/>
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
    if (!this.isAdmin() && !this.isSelf()) return
    return <section>
      <FormattedMessage id='user-settings.email-addresses.title' tagName='h2'/>
      <div className='text'>
        {this.renderEmailList()}
      </div>
    </section>
  }

  renderCalendar () {
    return <section>
      <FormattedMessage tagName='h2' id='user-settings.calendar.title'/>
      <div className='text'>
        <FormattedMessage tagName='div' id='user-settings.calendar.text' values={{
          nl: <br/>,
          link: <a href='/calendar' target='_blank'><FormattedMessage id='user-settings.calendar.text.link'/></a>
        }}/>
      </div>
    </section>
  }

  render () {
    const user = this.user()
    return <DocumentTitle title='document-title.profile-settings'>
      <main className='topNaved' id='Settings'>
        <FormattedMessage tagName='h1' id='user-settings.title'/>
        <section>
          <FormattedMessage tagName='h2' id='user-settings.basic-info.title'/>
          <UserNameForm user={user}/>
        </section>
        {this.renderCalendar()}
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
      {user.laundries
        .map(id => this.props.laundries[id])
        .filter(l => l)
        .map(laundry =>
          <li key={laundry.id}>
            <div className='name'>
              <Link to={`/laundries/${laundry.id}`}>{laundry.name}</Link>
            </div>
          </li>)}
    </ul>
  }
}

const UserSettingsWrapper = (props: UserSettingsProps) => {
  if (!props.users[props.user]) {
    return <NotFound/>
  }
  return <UserSettings {...props} />
}

UserSettingsWrapper.propTypes = UserSettings.propTypes

const UserSettingsLoaderWrapper = (props: UserSettingsProps) => {
  const cUser = props.users[props.currentUser]
  if (cUser.role !== 'admin') {
    return <UserSettingsWrapper {...props} />
  }
  return <Loader loader={() => sdk.fetchUser(props.user)}>
    <UserSettingsWrapper {...props} />
  </Loader>
}

export default UserSettingsLoaderWrapper
