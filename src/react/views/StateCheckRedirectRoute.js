// @flow
const React = require('react')
const {Route, Redirect} = require('react-router')
type StateCheckRedirectRouteProps<T> = {
  path: string,
  component: ReactClass<*>,
  redirectTo?: string,
  test:(T) => boolean,
  state: T
}
const StateCheckRedirectRoute = ({test, component, state, redirectTo, path}: StateCheckRedirectRouteProps<*>) => (
  <Route
    path={path}
    render={props => test(state)
      ? <component {...props} />
      : <Redirect to={redirectTo} />
    } />
)

export default StateCheckRedirectRoute
