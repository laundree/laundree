const React = require('react')
const {DocumentTitle} = require('./intl')
const {FormattedMessage} = require('react-intl')

const Privacy = () => <DocumentTitle title='document-title.pp-and-toc'>
  <section id='Privacy'>
    <FormattedMessage id='pp-and-toc.title' tagName='h1'/>
    <div className='disclaimer'>
      <FormattedMessage
        id='pp-and-toc.disclaimer'
        values={{
          note: <FormattedMessage tagName='b' id='pp-and-toc.disclaimer.note'/>
        }}
      />
    </div>
    <FormattedMessage
      id='pp-and-toc.policy'
      values={{
        nl: <br />,
        githubLink: <a href='https://github.com/laundree/laundree' target='_blank'>github.com/laundree/laundree</a>,
        contactMail: <a href='mainto:budde@laundree.io'>budde@laundree.io</a>
      }}
      tagName='div'/>
  </section>
</DocumentTitle>

module.exports = Privacy
