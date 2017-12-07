// @flow
import ReactGA from 'react-ga'
import React from 'react'
import type { Location } from 'react-router'
import type { State } from 'laundree-sdk/lib/redux'
import { connect } from 'react-redux'

type GAWrapperProps = {
  currentUser: ?string,
  children: *,
  location: Location
}

class GAWrapper extends React.Component<GAWrapperProps> {
  log () {
    ReactGA.set({
      userId: this.props.currentUser,
      path: this.props.location.pathname
    })
    ReactGA.pageview(this.props.location.pathname)
  }

  componentWillReceiveProps () {
    this.log()
  }

  componentDidMount () {
    this.log()
  }

  render () {
    return this.props.children
  }
}

export default connect(({currentUser}: State): { currentUser: ?string } => ({currentUser}))(GAWrapper)
