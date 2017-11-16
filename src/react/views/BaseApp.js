// @flow
import React from 'react'
import { DocumentTitle } from './intl'
import { Switch, Route } from 'react-router'
import Support from './Support'
import StateCheckRedirectRoute from './StateCheckRedirectRoute'
import NotFound from '../views/NotFound'
import LeftNav from './LeftNav'
import UserSettings from './UserSettings'
import Home from './Home'
import LandingPage from './LandingPage'
import type { User, State } from 'laundree-sdk/lib/redux'
import TopNav from './TopNav'
import { connect } from 'react-redux'

type BaseAppProps = {
  children?: *,
  user: ?User
}

const BaseApp = (props: BaseAppProps) => {
  return (
    <DocumentTitle title='document-title.base'>
      <div>
        <Route component={TopNav} />
        {
          props.user
            ? (
              <Switch>
                <Route exact path={'/'} component={Home} />
                <StateCheckRedirectRoute
                  test={({currentUser}) => Boolean(currentUser)}
                  path={'/support'}
                  redirectTo={'/'}
                  component={Support} />
                <StateCheckRedirectRoute
                  test={({currentUser}) => Boolean(currentUser)}
                  path={'/laundries/:laundryId'}
                  redirectTo={'/auth'}
                  component={LeftNav} />
                <StateCheckRedirectRoute
                  test={({currentUser}) => Boolean(currentUser)}
                  path={'/users/:userId/settings'}
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
}

export default connect(({users, currentUser}: State): BaseAppProps => ({
  user: (currentUser && users[currentUser]) || null
}))(BaseApp)
