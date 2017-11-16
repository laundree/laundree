// @flow
import React from 'react'
import ContactForm from './ContactForm'
import { DocumentTitle } from './intl'
import { FormattedMessage } from 'react-intl'

export default class Support extends React.Component<{}> {

  render () {
    return <DocumentTitle title='document-title.signup'>
      <main id='Support' className='topNaved'>
        <FormattedMessage tagName='h1' id='support.title'/>
        <FormattedMessage tagName='section' id='support.message'/>
        <ContactForm/>
      </main>
    </DocumentTitle>
  }
}
