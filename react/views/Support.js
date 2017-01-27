const React = require('react')
const ContactForm = require('./contact_form.jsx')
const {DocumentTitle} = require('./intl')
const {FormattedMessage} = require('react-intl')

class Support extends React.Component {

  render () {
    const user = this.props.users[this.props.currentUser]
    return <DocumentTitle title='document-title.signup'>
      <main id='Support' className='topNaved'>
        <FormattedMessage tagName='h1' id='support.title'/>
        <FormattedMessage tagName='section' id='support.message'/>
        <ContactForm user={user.demo ? null : user}/>
      </main>
    </DocumentTitle>
  }
}

Support.propTypes = {
  currentUser: React.PropTypes.string.isRequired,
  users: React.PropTypes.object.isRequired
}

module.exports = Support
