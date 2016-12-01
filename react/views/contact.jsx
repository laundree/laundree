const React = require('react')
const ContactForm = require('./contact_form.jsx')
const DocumentTitle = require('./document-title-intl.jsx')
const {FormattedMessage, FormattedHTMLMessage} = require('react-intl')

class Contact extends React.Component {

  render () {
    return <DocumentTitle id='document-title.contact'>
      <main id='Contact' className='topNaved'>
        <h1><FormattedMessage id='contact.title'/></h1>
        <section>
          <FormattedHTMLMessage id='contact.message'/>
        </section>
        <ContactForm/>
      </main>
    </DocumentTitle>
  }
}

module.exports = Contact
