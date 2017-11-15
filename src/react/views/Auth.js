// @flow
import React from 'react'
import LocaleSelector from './LocaleSelect'
import Forgot from '../containers/Forgot'
import SignUp from '../containers/SignUp'
import Reset from '../containers/Reset'
import Verification from '../containers/Verification'
import Login from '../containers/Login'
import NotFound from '../views/NotFound'
import { Switch, Route } from 'react-router'
import type { Location, Match } from 'react-router'

const Auth = ({children, location, match}: { match: Match, location: Location, children: * }) => (
  <div>
    <nav id='AuthNav'>
      <LocaleSelector location={location} />
    </nav>
    <main>
      <section id='Auth'>

        <Switch>
          <Route path={`${match.url}/forgot`} component={Forgot} />
          <Route path={`${match.url}/sign-up`} component={SignUp} />
          <Route path={`${match.url}/reset`} component={Reset} />
          <Route path={`${match.url}/verification`} component={Verification} />
          <Route path={`${match.url}/`} component={Login} />
          <Route component={NotFound} />
        </Switch>
      </section>
    </main>
  </div>)

export default Auth
