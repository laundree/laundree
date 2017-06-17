/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const TopNav = require('./TopNav')
const Footer = require('./Footer')
const {DocumentTitle} = require('./intl')
const {Switch, Route} = require('react-router')
const About = require('../containers/About')
const Home = require('../containers/Home')
const Contact = require('../containers/Contact')
const Support = require('../containers/Support')
const StateCheckRedirectRoute = require('../containers/StateCheckRedirectRoute')
const NotFound = require('../containers/NotFound')
const LeftNav = require('../containers/LeftNav')
const UserSettings = require('../containers/UserSettings')

class BaseApp extends React.Component {
  renderContent () {
    return <Switch>
      <Route exact path='/' component={Home} />
      <Route path='/about' component={About} />
      <StateCheckRedirectRoute
        test={({currentUser}) => currentUser}
        path='/support'
        redirectTo={'/contact'}
        component={Support} />
      <StateCheckRedirectRoute
        test={({currentUser}) => !currentUser}
        path='/contact'
        redirectTo={'/support'}
        component={Contact} />
      <StateCheckRedirectRoute
        test={({currentUser}) => currentUser}
        path='/laundries/:laundryId'
        redirectTo={'/auth'}
        component={LeftNav} />
      <StateCheckRedirectRoute
        test={({currentUser}) => currentUser}
        path='/users/:userId/settings'
        redirectTo={'/auth'}
        component={UserSettings} />
      <Route component={NotFound} />
    </Switch>
  }

  render () {
    return <DocumentTitle title='document-title.base'>
      <div className={this.props.user ? '' : 'footer'}>
        <TopNav
          config={this.props.config}
          user={this.props.user}
          location={this.props.location}
          currentLaundry={this.props.currentLaundry}
          laundries={this.props.laundries} />
        {this.renderContent()}
        {this.props.user ? null : <Footer />}
      </div>
    </DocumentTitle>
  }
}

BaseApp.propTypes = {
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

module.exports = BaseApp
