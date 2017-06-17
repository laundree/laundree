// @flow
import React from 'react'
import type { Children } from 'react'
import LocaleSelector from './LocaleSelect'
import Forgot from '../containers/Forgot'
import SignUp from '../containers/SignUp'
import Reset from '../containers/Reset'
import Verification from '../containers/Verification'
import Login from '../containers/Login'
import NotFound from '../containers/NotFound'
import { Switch, Route } from 'react-router'
import type {LocaleType} from '../../locales'
import type {Location} from 'react-router'

const Auth = ({children, locale, location}: { locale: LocaleType, location: Location, children: Children }) => <div>
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

export default Auth
