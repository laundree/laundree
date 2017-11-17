// @flow
import React from 'react'
import LocaleSelector from './LocaleSelect'
import Forgot from './Forgot'
import SignUp from './SignUp'
import Reset from './Reset'
import Verification from './Verification'
import Login from './Login'
import LaundryAuth from './LaundryAuth'
import NotFound from './NotFound'
import { Switch, Route } from 'react-router'

const Auth = ({children}: { children: * }) => (
  <div>
    <nav id='AuthNav'>
      <LocaleSelector/>
    </nav>
    <main>
      <section id='Auth'>

        <Switch>
          <Route path={'/auth'} exact component={Login} />
          <Route path={'/auth/forgot'} component={Forgot} />
          <Route path={'/auth/sign-up'} component={SignUp} />
          <Route path={'/auth/reset'} component={Reset} />
          <Route path={'/auth/verification'} component={Verification} />
          <Route path={'/auth/laundries/:laundryId/:key'} component={LaundryAuth}/>
          <Route component={NotFound} />
        </Switch>
      </section>
    </main>
  </div>)

export default Auth
