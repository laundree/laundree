/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const TopNav = require('./TopNav')
const Footer = require('./Footer')
const {DocumentTitle} = require('./intl')

class App extends React.Component {
  render () {
    return <DocumentTitle title='document-title.base'>
      <div className={this.props.user ? '' : 'footer'}>
        <TopNav
          config={this.props.config}
          user={this.props.user}
          location={this.props.location}
          currentLaundry={this.props.currentLaundry}
          laundries={this.props.laundries}/>
        {this.props.children}
        {this.props.user ? null : <Footer />}
      </div>
    </DocumentTitle>
  }
}

App.propTypes = {
  location: React.PropTypes.object,
  config: React.PropTypes.shape({
    locale: React.PropTypes.string.isRequired,
    returningUser: React.PropTypes.bool.isRequired
  }),
  children: React.PropTypes.any,
  currentLaundry: React.PropTypes.string,
  laundries: React.PropTypes.object,
  user: React.PropTypes.shape({
    id: React.PropTypes.string,
    photo: React.PropTypes.string
  })
}

module.exports = App
