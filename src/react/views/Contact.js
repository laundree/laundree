// @flow

import React from 'react'
import ContactForm from './ContactForm'
import { DocumentTitle } from './intl'
import { FormattedMessage, FormattedHTMLMessage } from 'react-intl'

const Contact = () => {
  return <DocumentTitle title='document-title.contact'>
    <main id='Contact' className='topNaved'>
      <h1><FormattedMessage id='contact.title'/></h1>
      <section>
        <FormattedHTMLMessage id='contact.message'/>
      </section>
      <ContactForm/>
    </main>
  </DocumentTitle>
}

export default Contact
