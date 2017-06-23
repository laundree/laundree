// @flow
import React from 'react'
import {DocumentTitle} from './intl'
import {FormattedMessage} from 'react-intl'

const About = () => <DocumentTitle title='document-title.about'>
  <main id='About' className='topNaved'>
    <FormattedMessage tagName='h1' id='about.title' />
    <section id='Mission'>
      <FormattedMessage tagName='h2' id='about.mission.title' />
      <FormattedMessage
        tagName='div'
        values={{nl: <br />}}
        id='about.mission.text' />
    </section>
  </main>
</DocumentTitle>

export default About
