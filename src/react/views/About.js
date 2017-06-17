const React = require('react')
const {DocumentTitle} = require('./intl')
const {FormattedMessage} = require('react-intl')

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

module.exports = About
