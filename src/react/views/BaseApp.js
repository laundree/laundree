// @flow
import React from 'react'
import TopNav from './TopNav'
import Footer from './Footer'
import { DocumentTitle } from './intl'
import { Switch, Route } from 'react-router'
import About from '../containers/About'
import Home from '../containers/Home'
import Contact from '../containers/Contact'
import Support from '../containers/Support'
import StateCheckRedirectRoute from '../containers/StateCheckRedirectRoute'
import NotFound from '../containers/NotFound'
import LeftNav from '../containers/LeftNav'
import UserSettings from '../containers/UserSettings'
import type { Location } from 'react-router'
import type { Children } from 'react'

export default class BaseApp extends React.Component {
  props: {
    location: Location,
    config: {
      locale: string,
      returningUser: boolean
    },
    children: Children,
    currentLaundry: string,
    laundries: { [string]: Laundry },
    user: User
  }

  renderContent () {
    return <Switch>
      <Route exact path='/' component={Home} />
      <Route path='/about' component={About} />
      <StateCheckRedirectRoute
        test={({currentUser}) => currentUser}
        path='/support'
        redirectTo={'/contact'}
        component={Support} />
      <StateCheckRedirectRoute
        test={({currentUser}) => !currentUser}
        path='/contact'
        redirectTo={'/support'}
        component={Contact} />
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
  }

  render () {
    return <DocumentTitle title='document-title.base'>
      <div className={this.props.user ? '' : 'footer'}>
        <TopNav
          config={this.props.config}
          user={this.props.user}
          location={this.props.location}
          currentLaundry={this.props.currentLaundry}
          laundries={this.props.laundries} />
        {this.renderContent()}
        {this.props.user ? null : <Footer />}
      </div>
    </DocumentTitle>
  }
}
