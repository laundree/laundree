const React = require('react')
const ContactForm = require('./contact_form.jsx')
const DocumentTitle = require('react-document-title')

class Support extends React.Component {

  render () {
    return <DocumentTitle title='Support'>
      <main id='Support' className='topNaved'>
        <h1>Support</h1>
        <section>
          Experiencing any problems using this amazing system? Do you have any feedback that you want to share? Please
          contact us with the form below, and we'll get right back at you!
        </section>
        <ContactForm user={this.props.users[this.props.currentUser]}/>
      </main>
    </DocumentTitle>
  }
}

Support.propTypes = {
  currentUser: React.PropTypes.string.isRequired,
  users: React.PropTypes.object.isRequired
}

module.exports = Support
