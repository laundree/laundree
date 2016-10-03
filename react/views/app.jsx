/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const TopNav = require('./topnav.jsx')
const Footer = require('./footer.jsx')

class App extends React.Component {

  render () {
    return <div className={this.props.user ? '' : 'footer'}>
      <TopNav user={this.props.user} currentLaundry={this.props.currentLaundry} laundries={this.props.laundries}/>
      {this.props.children}
      {this.props.user ? null : <Footer />}
    </div>
  }
}

App.propTypes = {
  children: React.PropTypes.any,
  currentLaundry: React.PropTypes.string,
  laundries: React.PropTypes.object,
  user: React.PropTypes.shape({
    id: React.PropTypes.string,
    photo: React.PropTypes.string
  })
}

module.exports = App
