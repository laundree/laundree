// @flow
import React from 'react'
import ContactForm from './ContactForm'
import { DocumentTitle } from './intl'
import { FormattedMessage } from 'react-intl'

export default class Support extends React.Component {
  props: {
    currentUser: string,
    users: { [string]: User }
  }

  render () {
    const user = this.props.users[this.props.currentUser]
    return <DocumentTitle title='document-title.signup'>
      <main id='Support' className='topNaved'>
        <FormattedMessage tagName='h1' id='support.title'/>
        <FormattedMessage tagName='section' id='support.message'/>
        <ContactForm user={user.demo ? undefined : user}/>
      </main>
    </DocumentTitle>
  }
}
