// @flow
import React from 'react'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'
import * as locales from './../../locales'
import { Redirect, Route, Switch } from 'react-router'
import Auth from '../containers/Auth'
import BaseApp from '../containers/BaseApp'
import NativeApp from '../containers/NativeApp'
import NativeAppV2 from '../containers/NativeAppV2'
import TermsAndConditions from '../containers/TermsAndConditions'
import StateCheckRedirectRoute from '../containers/StateCheckRedirectRoute'
import GAWrapper from '../containers/GAWrapper'
import type { LocaleType } from './../../locales'
import NotFound from './NotFound'

const App = (props: { locale: LocaleType, store: Store }) => {
  return (
    <Provider store={props.store}>
      <Route children={({location}) => (
        <GAWrapper location={location}>
          <Switch>
            {
              locales.supported.map(locale => (
                <Route path={`/${locale}`} key={locale} render={({match}) => (
                  <IntlProvider locale={locale} messages={locales[locale]}>
                    <Switch>
                      <StateCheckRedirectRoute
                        redirectTo={`/${locale}`}
                        test={({currentUser}) => !currentUser}
                        path={`/${locale}/auth`}
                        component={Auth} />
                      <Route path={`/${locale}/privacy`} component={TermsAndConditions} />
                      <Route path={`/${locale}/terms-and-conditions`} component={TermsAndConditions} />
                      <Route path={`/${locale}/native-app`} component={NativeApp} />
                      <Route path={`/${locale}/native-app-v2`} component={NativeAppV2} />
                      <Route path={`/${locale}/laundries/:laundryId`} component={BaseApp} />
                      <Route path={`/${locale}`} component={BaseApp} />
                    </Switch>
                  </IntlProvider>
                )} />))
            }
            <Redirect from={'/'} to={`/${props.locale}`} exact />
            <Route component={NotFound} />
          </Switch>
        </GAWrapper>
      )} />
    </Provider>
  )
}

export default App
