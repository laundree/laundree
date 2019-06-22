// @flow
import React from 'react'
import ContactForm from './ContactForm'
import { Meta } from './intl'
import { FormattedMessage } from 'react-intl'

export default class Support extends React.Component<{}> {
  render () {
    return (
      <main id='Support' className='topNaved'>
        <Meta title={'document-title.support'} />
        <FormattedMessage tagName='h1' id='support.title' />
        <FormattedMessage tagName='section' id='support.message' />
        <ContactForm />
      </main>)
  }
}
