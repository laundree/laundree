// @flow
import React from 'react'
import {Route, Redirect} from 'react-router'

type StateCheckRedirectRouteProps<T> = {
  path: string,
  component: ReactClass<*>,
  redirectTo?: string,
  test:(T) => boolean,
  state: T
}
const StateCheckRedirectRoute = ({test, component: Component, state, redirectTo, path}: StateCheckRedirectRouteProps<*>) => {
  return (
    <Route
      path={path}
      render={props => test(state)
        ? <Component {...props} />
        : <Redirect to={redirectTo} />
      } />
  )
}

export default StateCheckRedirectRoute
