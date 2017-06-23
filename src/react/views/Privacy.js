// @flow
import React from 'react'
import { DocumentTitle } from './intl'
import { FormattedMessage } from 'react-intl'

const Privacy = () => <DocumentTitle title='document-title.pp-and-toc'>
  <section id='Privacy'>
    <FormattedMessage id='pp-and-toc.title' tagName='h1' />
    <div className='disclaimer'>
      <FormattedMessage
        id='pp-and-toc.disclaimer'
        values={{
          note: <FormattedMessage tagName='b' id='pp-and-toc.disclaimer.note' />
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
      tagName='div' />
  </section>
</DocumentTitle>

export default Privacy
