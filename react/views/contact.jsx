const React = require('react')
const ContactForm = require('./contact_form.jsx')
const DocumentTitle = require('react-document-title')

class Contact extends React.Component {

  render () {
    return <DocumentTitle title='Support'>
      <main id='Contact' className='topNaved'>
        <h1>Contact</h1>
        <section>
          Having any concerns or questions? Please don't hesitate to contact us via. the form below.
        </section>
        <ContactForm/>
      </main>
    </DocumentTitle>
  }
}

module.exports = Contact
