// @flow
import React from 'react'
import { ValidationForm, ValidationElement } from './validation'
import ValueUpdater from './helpers/ValueUpdater'
import { DocumentTitle, Modal, Label, Input, Submit } from './intl'
import { FormattedMessage } from 'react-intl'
import sdk from '../../client/sdk'
import Loader from './Loader'
import { DropDown, DropDownTitle, DropDownContent, DropDownCloser } from './dropdown'
import { Link } from 'react-router-dom'
import type { Laundry, User, Invite } from 'laundree-sdk/lib/redux'
import type { LocaleType } from '../../locales'

class InviteUserForm extends ValueUpdater<{ email: string }, { laundry: Laundry, locale: LocaleType }, {}> {
  submitHandler = async (evt: Event) => {
    evt.preventDefault()
    await sdk.api.laundry
      .inviteUserByEmail(this.props.laundry.id, {email: this.state.values.email, locale: this.props.locale})
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
        <FormattedMessage id='users.invite.demo'/>
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
              value={this.state.values.email}/>
          </Label>
        </ValidationElement>
      </div>
      <div className='buttons'>
        <Submit value='general.invite'/>
      </div>
    </ValidationForm>
  }
}

class QrInvite extends React.Component {
  state = {}
  props: {
    laundry: Laundry,
    locale: LocaleType
  }

  async generatePdf () {
    if (this.state.generating) return
    this.setState({generating: true})
    const {key} = await sdk.api.laundry.createInviteCode(this.props.laundry.id)
    this.setState({key, generating: false})
  }

  generateLink () {
    if (!this.state.key) {
      return <button
        className={'pdfLink' + (this.state.generating ? 'inactive' : '')}
        onClick={() => this.generatePdf()}>
        {this.state.generating
          ? <FormattedMessage id='general.generating'/>
          : <FormattedMessage id='users.qr-signup.generate-code'/>}
      </button>
    }
    return <a
      className='button red qr-download'
      href={`/pdf/invitation/${this.props.laundry.id}/${this.state.key}.pdf`}
      target='_blank'>
      <svg>
        <use xlinkHref='#MediaDownload'/>
      </svg>
      <FormattedMessage id='users.qr-signup.download'/>
    </a>
  }

  render () {
    return <div id='QrSignUp'>
      <FormattedMessage
        id='users.qr-signup.message'
        values={{
          nl: <br/>
        }}/>
      <div className={'linkContainer buttonContainer' + (this.state.generating ? ' generating' : '')}>
        {this.generateLink()}
      </div>
    </div>
  }
}

class LinkElement extends React.Component {
  props: { link: string }

  render () {
    return <div className='link'>{this.props.link}</div>
  }
}

class LinkInvite extends React.Component {
  state: { link: ?string } = {link: null}
  props: { laundry: Laundry }

  generateLink () {
    if (this.state.generating) return
    this.setState({generating: true})
    sdk.api.laundry
      .createInviteCode(this.props.laundry.id)
      .then(({href}) => this.setState({link: href, generating: false}))
  }

  renderLink () {
    if (this.state.link) {
      return <LinkElement link={this.state.link}/>
    }
    return <button onClick={() => this.generateLink()} className={this.state.generating ? 'inactive' : ''}>
      {this.state.generating
        ? <FormattedMessage id='general.generating'/>
        : <FormattedMessage id='users.invite-form-link.button'/>}
    </button>
  }

  render () {
    return <div id='UserLinkSignUp'>
      <FormattedMessage id='users.invite-form-link.text' values={{
        nl: <br/>
      }}/>
      <div className={'linkContainer buttonContainer ' + (this.state.generating ? 'generating' : '')}>
        {this.renderLink()}
      </div>
    </div>
  }
}

class UserItem extends React.Component {
  props: {
    user: User,
    laundry: Laundry,
    currentUser: User
  }
  state = {showModal: false}
  onShowModal = () => this.setState({showModal: true})
  onCloseModal = () => this.setState({showModal: false})
  handleDelete = () => sdk.api.laundry.removeUserFromLaundry(this.props.laundry.id, this.props.user.id)

  makeOwner () {
    sdk.api.laundry.addOwner(this.props.laundry.id, this.props.user.id)
  }

  makeUser () {
    sdk.api.laundry.removeOwner(this.props.laundry.id, this.props.user.id)
  }

  isCurrentUser () {
    return this.props.user.id === this.props.currentUser.id
  }

  renderRole () {
    const isOwner = this.isOwner()
    if (this.isCurrentUser() || (isOwner && this.props.laundry.owners.length === 1)) {
      return <span className='owner'><FormattedMessage id='users.owner'/></span>
    }
    return <DropDown>
      <DropDownTitle>
          <span className='owner'>
            <FormattedMessage id={isOwner ? 'users.owner' : 'users.user'}/>
          </span>
      </DropDownTitle>
      <DropDownContent>
        <ul className='dropDownList'>
          <DropDownCloser>
            <li className={isOwner ? 'active' : ''} onClick={() => this.makeOwner()}>
              <span className='link'><FormattedMessage id='users.owner'/></span>
            </li>
          </DropDownCloser>
          <DropDownCloser>
            <li className={isOwner ? '' : 'active'} onClick={() => this.makeUser()}>
              <span className='link'><FormattedMessage id='users.user'/></span>
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
        <use xlinkHref='#Trash'/>
      </svg>
    </div>
  }

  isOwner () {
    return this.props.laundry.owners.indexOf(this.props.user.id) >= 0
  }

  renderName () {
    if (!this.addUserLink()) return this.props.user.displayName
    return <Link to={`/users/${this.props.user.id}/settings`}>
      {this.props.user.displayName}
    </Link>
  }

  renderAvatar () {
    const avatarImage = <img className='avatar' src={this.props.user.photo}/>
    if (!this.addUserLink()) return avatarImage
    return <Link to={`/users/${this.props.user.id}/settings`}>
      {avatarImage}
    </Link>
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
        ]}/>
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
    return this.props.user.id === this.props.currentUser.id || this.props.currentUser.role === 'admin'
  }
}

class InviteItem extends React.Component {

  state = {showModal: false}
  onShowModal = () => this.setState({showModal: true})
  onCloseModal = () => this.setState({showModal: false})
  handleDelete = () => sdk.api.invite.del(this.props.invite.id)
  props: {
    invite: Invite
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
        ]}/>
      <div className='avatarContainer'/>
      <div className='name'>
        {this.props.invite.email}
        <div className='delete action'>
          <svg onClick={this.onShowModal}>
            <use xlinkHref='#Trash'/>
          </svg>
        </div>
      </div>
    </div>
  }
}

export default class Users extends React.Component {
  props: {
    locale: LocaleType,
    invites: { [string]: Invite },
    users: { [string]: User },
    laundry: Laundry,
    currentUser: string
  }

  renderUsers () {
    return <ul className='bigList'>
      {this.users().map(user => <li key={user.id}><UserItem
        user={user}
        currentUser={this.currentUser()}
        laundry={this.props.laundry}/></li>)}
      {this.invites().map(invite => <li key={invite.id}><InviteItem invite={invite}/></li>)}
    </ul>
  }

  load () {
    return sdk.listUsersAndInvites(this.props.laundry.id)
  }

  users () {
    return this.props.laundry.users.map(id => this.props.users[id]).filter(u => u)
  }

  invites () {
    return this.props.laundry.invites.map((id) => this.props.invites[id]).filter((i) => i).filter(({used}) => !used)
  }

  currentUser () {
    return this.props.users[this.props.currentUser]
  }

  render () {
    return <DocumentTitle title='document-title.laundry-users'>
      <Loader loader={() => this.load()}>
        <main className='naved' id='Users'>
          <h1 className='alignLeft'>
            <FormattedMessage id='users.title'/>
          </h1>
          <section id='UserList'>
            {this.renderUsers()}
          </section>
          <section id='InviteUserForm'>
            <FormattedMessage id='users.invite-from-email' tagName='h2'/>
            <InviteUserForm laundry={this.props.laundry} locale={this.props.locale}/>
          </section>
          <section id='QrInviteSection'>
            <FormattedMessage id='users.invite-from-qr' tagName='h2'/>
            <QrInvite laundry={this.props.laundry} locale={this.props.locale}/>
          </section>
          <section id='LinkInviteSection'>
            <FormattedMessage id='users.invite-from-link' tagName='h2'/>
            <LinkInvite laundry={this.props.laundry}/>
          </section>
        </main>
      </Loader>
    </DocumentTitle>
  }
}
