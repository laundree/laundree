/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const TopNav = require('./topnav.jsx')
const Footer = require('./footer.jsx')
const LeftNav = require('./leftnav.jsx')
class App extends React.Component {

  render () {
    return <div className={this.props.user ? 'no_footer' : ''}>
      <TopNav user={this.props.user}/>
      {this.props.children}
      {this.props.currentLaundry ? <LeftNav currentLaundry={this.props.currentLaundry}/> : null}
      {this.props.user ? null : <Footer />}
    </div>
  }
}

App.propTypes = {
  children: React.PropTypes.any,
  currentLaundry: React.PropTypes.string,
  user: React.PropTypes.shape({
    id: React.PropTypes.string,
    photo: React.PropTypes.string
  })
}

module.exports = App
