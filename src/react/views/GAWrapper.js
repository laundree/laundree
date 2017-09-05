// @flow
import ReactGA from 'react-ga'
import React from 'react'
import type {Location} from 'react-router'

class GAWrapper extends React.Component<{
  currentUser: string,
    children: *,
    location: Location
}> {
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

export default GAWrapper
