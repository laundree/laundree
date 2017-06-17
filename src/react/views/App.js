/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const {IntlProvider} = require('react-intl')
const {Provider} = require('react-redux')
const locales = require('./../../locales')
const {Route, Switch} = require('react-router')
const Auth = require('../containers/Auth')
const BaseApp = require('../containers/BaseApp')
const NativeApp = require('../containers/NativeApp')
const NativeAppV2 = require('../containers/NativeAppV2')
const TermsAndConditions = require('../views/TermsAndConditions')
const Privacy = require('../views/Privacy')
const StateCheckRedirectRoute = require('../containers/StateCheckRedirectRoute')
const GAWrapper = require('../containers/GAWrapper')

class App extends React.Component {
  render () {
    return <IntlProvider locale={this.props.locale} messages={locales[this.props.locale].messages}>
      <Provider store={this.props.store}>
        <Route children={({location}) => (
          <GAWrapper location={location}>
            <Switch>
              <StateCheckRedirectRoute
                redirectTo='/'
                test={({currentUser}) => !currentUser}
                path='/auth'
                component={Auth} />
              <Route path='/privacy' component={Privacy} />
              <Route path='/terms-and-conditions' component={TermsAndConditions} />
              <Route path='/native-app' component={NativeApp} />
              <Route path='/native-app-v2' component={NativeAppV2} />
              <Route path='/laundries/:laundryId' component={BaseApp} />
              <Route path='/' component={BaseApp} />
            </Switch>
          </GAWrapper>
        )} />
      </Provider>
    </IntlProvider >
  }
}

App.propTypes = {
  locale: React.PropTypes.oneOf(locales.supported),
  store: React.PropTypes.object.isRequired
}

module.exports = App
