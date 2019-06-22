// @flow
import React from 'react'
import { Route, Redirect } from 'react-router'
import type { ComponentType } from 'react'
import type { State } from '../../node_modules/laundree-sdk/lib/redux'
import { connect } from 'react-redux'

type StateCheckRedirectRouteProps = {
  path: string,
  component: ComponentType<*>,
  redirectTo: string,
  test: State => boolean,
  state: State
}
const StateCheckRedirectRoute = ({test, component: Component, state, redirectTo, path}: StateCheckRedirectRouteProps) => {
  return (
    <Route
      path={path}
      render={props => test(state)
        ? <Component {...props} />
        : <Redirect to={redirectTo} />
      } />
  )
}

export default connect((state: State): {state: State} => ({state}))(StateCheckRedirectRoute)
