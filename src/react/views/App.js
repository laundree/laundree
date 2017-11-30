// @flow
import React from 'react'
import { IntlProvider } from 'react-intl'
import { connect, Provider } from 'react-redux'
import * as locales from './../../locales'
import { Route, Switch } from 'react-router'
import Auth from './Auth'
import BaseApp from './BaseApp'
import NativeApp from './NativeApp'
import NativeAppV2 from './NativeAppV2'
import StateCheckRedirectRoute from './StateCheckRedirectRoute'
import GAWrapper from './GAWrapper'
import type { LocaleType } from './../../locales'
import NotFound from './NotFound'
import type { StateAddendum } from './types'
import { Helmet } from 'react-helmet'
import type { Location } from 'react-router'

const LinkAlternate = ({location, children, webBase}: { location: Location, children: *, webBase: string }) => {
  return [
    <Helmet key='1'>
      <link rel='alternate' href={`${webBase}/en${location.pathname}`} hrefLang='x-default' />
      {locales.supported.map(locale => (
        <link key={locale} rel='alternate' href={`${webBase}/${locale}${location.pathname}`} hrefLang={locale} />
      ))}
    </Helmet>,
    children
  ]
}

const LinkAlternateConntected = connect(({config: {webBase}}: StateAddendum): { webBase: string } => ({webBase}))(LinkAlternate)

const App = (props: { locale: LocaleType, store: Store }) => {
  return (
    <Provider store={props.store}>
      <Route children={({location}) => (
        <GAWrapper location={location}>
          <IntlProvider locale={props.locale} messages={locales[props.locale]}>
            <LinkAlternateConntected location={location}>
              <Switch>
                <StateCheckRedirectRoute
                  redirectTo={'/'}
                  test={({currentUser}) => !currentUser}
                  path={'/auth'}
                  component={Auth} />
                <Route path={'/laundries/:laundryId'} component={BaseApp} />
                <Route path={'/native-app'} component={NativeApp} />
                <Route path={'/native-app-v2'} component={NativeAppV2} />
                <Route path={'/'} component={BaseApp} />
                <Route component={NotFound} />
              </Switch>
            </LinkAlternateConntected>
          </IntlProvider>
        </GAWrapper>
      )} />
    </Provider>
  )
}

export default App
