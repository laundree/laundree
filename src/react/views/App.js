// @flow
import React from 'react'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'
import * as locales from './../../locales'
import { Route, Switch } from 'react-router'
import Auth from '../containers/Auth'
import BaseApp from '../containers/BaseApp'
import NativeApp from '../containers/NativeApp'
import NativeAppV2 from '../containers/NativeAppV2'
import TermsAndConditions from '../views/TermsAndConditions'
import Privacy from '../views/Privacy'
import StateCheckRedirectRoute from '../containers/StateCheckRedirectRoute'
import GAWrapper from '../containers/GAWrapper'
import type {LocaleType} from './../../locales'

const App = (props: {locale: LocaleType, store: Store}) => {
  return <IntlProvider locale={props.locale} messages={locales[props.locale].messages}>
    <Provider store={props.store}>
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

export default App
