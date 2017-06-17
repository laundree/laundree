/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const LocaleSelector = require('./LocaleSelect')
const Forgot = require('../containers/Forgot')
const SignUp = require('../containers/SignUp')
const Reset = require('../containers/Reset')
const Verification = require('../containers/Verification')
const Login = require('../containers/Login')
const NotFound = require('../containers/NotFound')

const {Switch, Route} = require('react-router')

const Auth = ({children, locale, location}) => <div>
  <nav id='AuthNav'>
    <LocaleSelector locale={locale} location={location} />
  </nav>
  <main>
    <section id='Auth'>
      <Switch>
        <Route exact path='/auth/' component={Login} />
        <Route path='/auth/forgot' component={Forgot} />
        <Route path='/auth/sign-up' component={SignUp} />
        <Route path='/auth/reset' component={Reset} />
        <Route path='/auth/verification' component={Verification} />
        <Route component={NotFound} />
      </Switch>
    </section>
  </main>
</div>

Auth.propTypes = {
  locale: React.PropTypes.string,
  location: React.PropTypes.object,
  children: React.PropTypes.any
}

module.exports = Auth
