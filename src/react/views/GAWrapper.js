// @flow
import ReactGA from 'react-ga'
import React from 'react'
import type {Location} from 'react-router'
import type {Children} from 'react'

class GAWrapper extends React.Component {
  props: {
    currentUser: string,
    children: Children,
    location: Location
  }
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
