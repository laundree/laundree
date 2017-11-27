// @flow
import React from 'react'
import { ValidationForm, ValidationElement } from './validation'
import ValueUpdater from './helpers/ValueUpdater'
import { Meta, Modal, Label, Input, Submit } from './intl'
import { FormattedMessage } from 'react-intl'
import sdk from '../../client/sdk'
import Loader from './Loader'
import { DropDown, DropDownTitle, DropDownContent, DropDownCloser } from './dropdown'
import { Link } from 'react-router-dom'
import type { Laundry, State, User, Invite } from 'laundree-sdk/lib/redux'
import type { LocaleType } from '../../locales'
import type { StateAddendum } from './types'
import { connect } from 'react-redux'
import ReactGA from 'react-ga'

class InviteUserForm extends ValueUpdater<{ email: string }, { laundry: Laundry, locale: LocaleType }, {}> {
  submitHandler = async (evt: Event) => {
    evt.preventDefault()
    await sdk.api.laundry
      .inviteUserByEmail(this.props.laundry.id, {email: this.state.values.email, locale: this.props.locale})
    ReactGA.event({category: 'Laundry', action: 'Invite user by email'})
    this.reset()
  }

  initialValues () {
    return {email: ''}
  }

  initialState () {
    return {}
  }

  render () {
    if (this.props.laundry.demo) {
      return <div className='text'>
        <FormattedMessage id='users.invite.demo' />
      </div>
    }
    return <ValidationForm
      sesh={this.state.sesh}
      onSubmit={this.submitHandler}>
      <div>
        <ValidationElement
          sesh={this.state.sesh}
          value={this.state.values.email} email trim>
          <Label
            data-validate-error='users.error.invalid-email'>
            <Input
              placeholder='general.email-address'
              type='text' onChange={this.generateValueEventUpdater(email => ({email}))}
              value={this.state.values.email} />
          </Label>
        </ValidationElement>
      </div>
      <div className='buttons'>
        <Submit value='general.invite' />
      </div>
    </ValidationForm>
  }
}

class QrInvite extends React.Component<{
  laundry: Laundry,
}, { generating?: boolean, key?: string }> {
  state = {}

  async generatePdf () {
    if (this.state.generating) return
    this.setState({generating: true})
    const {key} = await sdk.api.laundry.createInviteCode(this.props.laundry.id)
    ReactGA.event({category: 'Laundry', action: 'Create invite code'})
    this.setState({key, generating: false})
  }

  generateLink () {
    if (!this.state.key) {
      return <button
        className={'pdfLink' + (this.state.generating ? 'inactive' : '')}
        onClick={() => this.generatePdf()}>
        {this.state.generating
          ? <FormattedMessage id='general.generating' />
          : <FormattedMessage id='users.qr-signup.generate-code' />}
      </button>
    }
    return <a
      className='button red qr-download'
      href={`/pdf/invitation/${this.props.laundry.id}/${this.state.key}.pdf`}
      target='_blank'>
      <svg>
        <use xlinkHref='#MediaDownload' />
      </svg>
      <FormattedMessage id='users.qr-signup.download' />
    </a>
  }

  render () {
    return <div id='QrSignUp'>
      <FormattedMessage
        id='users.qr-signup.message'
        values={{
          nl: <br />
        }} />
      <div className={'linkContainer buttonContainer' + (this.state.generating ? ' generating' : '')}>
        {this.generateLink()}
      </div>
    </div>
  }
}

class LinkElement extends React.Component<{ link: string }> {
  render () {
    return <div className='link'>{this.props.link}</div>
  }
}

class LinkInvite extends React.Component<{ laundry: Laundry }, { link: ?string, generating?: boolean }> {
  state = {link: null}

  async generateLink () {
    if (this.state.generating) return
    this.setState({generating: true})
    const {href} = await sdk.api.laundry
      .createInviteCode(this.props.laundry.id)
    ReactGA.event({category: 'Laundry', action: 'Create invite code'})
    this.setState({link: href, generating: false})
  }

  renderLink () {
    if (this.state.link) {
      return <LinkElement link={this.state.link} />
    }
    return <button onClick={() => this.generateLink()} className={this.state.generating ? 'inactive' : ''}>
      {this.state.generating
        ? <FormattedMessage id='general.generating' />
        : <FormattedMessage id='users.invite-form-link.button' />}
    </button>
  }

  render () {
    return <div id='UserLinkSignUp'>
      <FormattedMessage id='users.invite-form-link.text' values={{
        nl: <br />
      }} />
      <div className={'linkContainer buttonContainer ' + (this.state.generating ? 'generating' : '')}>
        {this.renderLink()}
      </div>
    </div>
  }
}

class UserItem extends React.Component<{
  user: User,
  laundry: Laundry,
  currentUser: ?User
}, { showModal: boolean }> {
  state = {showModal: false}
  onShowModal = () => this.setState({showModal: true})
  onCloseModal = () => this.setState({showModal: false})
  handleDelete = async () => {
    const r = await sdk.api.laundry.removeUserFromLaundry(this.props.laundry.id, this.props.user.id)
    ReactGA.event({category: 'Laundry', action: 'Remove user from laundry'})
    return r
  }

  async makeOwner () {
    const r = await sdk.api.laundry.addOwner(this.props.laundry.id, this.props.user.id)
    ReactGA.event({category: 'Laundry', action: 'Add owner'})
    return r
  }

  async makeUser () {
    const r = await sdk.api.laundry.removeOwner(this.props.laundry.id, this.props.user.id)
    ReactGA.event({category: 'Laundry', action: 'Remove owner'})
    return r
  }

  isCurrentUser () {
    const currentUser = this.props.currentUser
    return currentUser && this.props.user.id === currentUser.id
  }

  renderRole () {
    const isOwner = this.isOwner()
    if (this.isCurrentUser() || (isOwner && this.props.laundry.owners.length === 1)) {
      return <span className='owner'><FormattedMessage id='users.owner' /></span>
    }
    return <DropDown>
      <DropDownTitle>
          <span className='owner'>
            <FormattedMessage id={isOwner ? 'users.owner' : 'users.user'} />
          </span>
      </DropDownTitle>
      <DropDownContent>
        <ul className='dropDownList'>
          <DropDownCloser>
            <li className={isOwner ? 'active' : ''} onClick={() => this.makeOwner()}>
              <span className='link'><FormattedMessage id='users.owner' /></span>
            </li>
          </DropDownCloser>
          <DropDownCloser>
            <li className={isOwner ? '' : 'active'} onClick={() => this.makeUser()}>
              <span className='link'><FormattedMessage id='users.user' /></span>
            </li>
          </DropDownCloser>
        </ul>
      </DropDownContent>
    </DropDown>
  }

  renderDelete () {
    if (this.isOwner()) return null
    return <div className='delete action'>
      <svg onClick={this.onShowModal}>
        <use xlinkHref='#Trash' />
      </svg>
    </div>
  }

  isOwner () {
    return this.props.laundry.owners.indexOf(this.props.user.id) >= 0
  }

  renderName () {
    if (!this.addUserLink()) return this.props.user.displayName
    return (
      <Link to={`/users/${this.props.user.id}/settings`}>
        {this.props.user.displayName}
      </Link>)
  }

  renderAvatar () {
    const avatarImage = <img className='avatar' src={this.props.user.photo} />
    if (!this.addUserLink()) return avatarImage
    return (
      <Link to={`/users/${this.props.user.id}/settings`}>
        {avatarImage}
      </Link>)
  }

  render () {
    return <div>
      <Modal
        show={this.state.showModal}
        onClose={this.onCloseModal}
        message='users.modal.delete-user'
        actions={[
          {label: 'general.yes', className: 'delete red', action: this.handleDelete},
          {label: 'general.no', action: this.onCloseModal}
        ]} />
      <div className='avatarContainer'>
        {this.renderAvatar()}
      </div>
      <div className='name'>
        {this.renderName()}
        {this.renderDelete()}
        {this.renderRole()}
      </div>
    </div>
  }

  addUserLink () {
    const currentUser = this.props.currentUser
    return currentUser && (this.props.user.id === currentUser.id || currentUser.role === 'admin')
  }
}

class InviteItem extends React.Component<{ invite: Invite }, { showModal: boolean }> {

  state = {showModal: false}
  onShowModal = () => this.setState({showModal: true})
  onCloseModal = () => this.setState({showModal: false})
  handleDelete = async () => {
    const r = await sdk.api.invite.del(this.props.invite.id)
    ReactGA.event({category: 'Laundry', action: 'Invite user'})
    return r
  }

  render () {
    return <div>
      <Modal
        show={this.state.showModal}
        onClose={this.onCloseModal}
        message='users.modal.delete-invite'
        actions={[
          {label: 'general.yes', className: 'delete red', action: this.handleDelete},
          {label: 'general.no', action: this.onCloseModal}
        ]} />
      <div className='avatarContainer' />
      <div className='name'>
        {this.props.invite.email}
        <div className='delete action'>
          <svg onClick={this.onShowModal}>
            <use xlinkHref='#Trash' />
          </svg>
        </div>
      </div>
    </div>
  }
}

type UsersProps = {
  invites: { [string]: Invite },
  users: { [string]: User },
  laundry: ?Laundry,
  currentUser: ?string,
  locale: LocaleType
}

class Users extends React.Component<UsersProps> {

  renderUsers (laundry: Laundry) {
    return <ul className='bigList'>
      {this.users(laundry).map(user => (
        <li key={user.id}>
          <UserItem
            user={user}
            currentUser={this.currentUser()}
            laundry={laundry} />
        </li>))}
      {this.invites(laundry).map(invite => <li key={invite.id}><InviteItem invite={invite} /></li>)}
    </ul>
  }

  load (laundry: Laundry) {
    return sdk.listUsersAndInvites(laundry.id)
  }

  users (laundry: Laundry) {
    return laundry.users.map(id => this.props.users[id]).filter(u => u)
  }

  invites (laundry: Laundry) {
    return laundry.invites.map((id) => this.props.invites[id]).filter((i) => i).filter(({used}) => !used)
  }

  currentUser () {
    const currentUser = this.props.currentUser
    return (currentUser && this.props.users[currentUser]) || null
  }

  render () {
    const laundry = this.props.laundry
    if (!laundry) return null
    return (
      <Loader loader={() => this.load(laundry)}>
        <main className='naved' id='Users'>
          <Meta title={'document-title.laundry-users'} />
          <h1 className='alignLeft'>
            <FormattedMessage id='users.title' />
          </h1>
          <section id='UserList'>
            {this.renderUsers(laundry)}
          </section>
          <section id='InviteUserForm'>
            <FormattedMessage id='users.invite-from-email' tagName='h2' />
            <InviteUserForm laundry={laundry} locale={this.props.locale} />
          </section>
          <section id='QrInviteSection'>
            <FormattedMessage id='users.invite-from-qr' tagName='h2' />
            <QrInvite laundry={laundry} />
          </section>
          <section id='LinkInviteSection'>
            <FormattedMessage id='users.invite-from-link' tagName='h2' />
            <LinkInvite laundry={laundry} />
          </section>
        </main>
      </Loader>)
  }
}

export default connect(({config: {locale}, laundries, users, invites, currentUser}: State & StateAddendum, {match: {params: {laundryId}}}): UsersProps => ({
  laundry: (laundryId && laundries[laundryId]) || null,
  users,
  invites,
  locale,
  currentUser
}))(Users)
