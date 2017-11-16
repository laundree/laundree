// @flow
import React from 'react'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'
import * as locales from './../../locales'
import { Route, Switch } from 'react-router'
import Auth from './Auth'
import BaseApp from './BaseApp'
import NativeApp from './NativeApp'
import NativeAppV2 from './NativeAppV2'
import TermsAndConditions from './TermsAndConditions'
import StateCheckRedirectRoute from './StateCheckRedirectRoute'
import GAWrapper from './GAWrapper'
import type { LocaleType } from './../../locales'
import NotFound from './NotFound'

const App = (props: { locale: LocaleType, store: Store }) => {
  return (
    <Provider store={props.store}>
      <Route children={({location}) => (
        <GAWrapper location={location}>
          <IntlProvider locale={props.locale} messages={locales[props.locale]}>
            <Switch>
              <StateCheckRedirectRoute
                redirectTo={'/'}
                test={({currentUser}) => !currentUser}
                path={'/auth'}
                component={Auth} />
              <Route path={'/privacy'} component={TermsAndConditions} />
              <Route path={'/terms-and-conditions'} component={TermsAndConditions} />
              <Route path={'/laundries/:laundryId'} component={BaseApp} />
              <Route path={'/'} component={BaseApp} />
              <Route path={'/native-app'} component={NativeApp} />
              <Route path={'/native-app-v2'} component={NativeAppV2} />
              <Route component={NotFound} />
            </Switch>
          </IntlProvider>
        </GAWrapper>
      )} />
    </Provider>
  )
}

export default App
