// @flow
import React from 'react'
import TopNav from './TopNav'
import { DocumentTitle } from './intl'
import { Switch, Route } from 'react-router'
import Support from '../containers/Support'
import StateCheckRedirectRoute from '../containers/StateCheckRedirectRoute'
import NotFound from '../views/NotFound'
import LeftNav from '../containers/LeftNav'
import UserSettings from '../containers/UserSettings'
import Home from '../containers/Home'
import LandingPage from './LandingPage'
import type { Location, Match } from 'react-router'
import type { Laundry, User } from 'laundree-sdk/lib/redux'
import { localeFromLocation } from '../../locales'

type BaseAppProps = {
  location: Location,
  match: Match,
  children?: *,
  currentLaundry: string,
  laundries: { [string]: Laundry },
  user: User
}

export default (props: BaseAppProps) => {
  const locale = localeFromLocation(props.location)
  return (
    <DocumentTitle title='document-title.base'>
      <div>
        <TopNav
          user={props.user}
          locale={locale}
          location={props.location}
          currentLaundry={props.currentLaundry}
          laundries={props.laundries} />
        {
          props.user
            ? (
              <Switch>
                <Route exact path={`/${locale}/`} component={Home} />
                <StateCheckRedirectRoute
                  test={({currentUser}) => currentUser}
                  path={`/${locale}/support`}
                  redirectTo={`/${locale}/`}
                  component={Support} />
                <StateCheckRedirectRoute
                  test={({currentUser}) => currentUser}
                  path={`/${locale}/laundries/:laundryId`}
                  redirectTo={`/${locale}/auth`}
                  component={LeftNav} />
                <StateCheckRedirectRoute
                  test={({currentUser}) => currentUser}
                  path={`/${locale}/users/:userId/settings`}
                  redirectTo={`/${locale}/auth`}
                  component={UserSettings} />
                <Route component={NotFound} />
              </Switch>
            )
            : (
              <LandingPage locale={locale} />
            )
        }
      </div>
    </DocumentTitle>)
}
