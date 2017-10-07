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
import type { Location } from 'react-router'
import type { Laundry, User } from 'laundree-sdk/lib/redux'

type BaseAppProps = {
  location: Location,
  config: {
    locale: string,
    returningUser: boolean
  },
  children?: *,
  currentLaundry: string,
  laundries: { [string]: Laundry },
  user: User
}

export default (props: BaseAppProps) => (
  <DocumentTitle title='document-title.base'>
    <div>
      <TopNav
        config={props.config}
        user={props.user}
        location={props.location}
        currentLaundry={props.currentLaundry}
        laundries={props.laundries} />
      {
        props.user
          ? (
            <Switch>
              <Route exact path='/' component={Home} />
              <StateCheckRedirectRoute
                test={({currentUser}) => currentUser}
                path='/support'
                redirectTo={'/contact'}
                component={Support} />
              <StateCheckRedirectRoute
                test={({currentUser}) => currentUser}
                path='/laundries/:laundryId'
                redirectTo={'/auth'}
                component={LeftNav} />
              <StateCheckRedirectRoute
                test={({currentUser}) => currentUser}
                path='/users/:userId/settings'
                redirectTo={'/auth'}
                component={UserSettings} />
              <Route component={NotFound} />
            </Switch>
          )
          : (
            <LandingPage />
          )
      }
    </div>
  </DocumentTitle>)
