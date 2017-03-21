/**
 * Created by budde on 21/03/2017.
 */
const React = require('react')
const {Route, Redirect} = require('react-router')

const StateCheckRedirectRoute = ({test, component: Component, state, redirectTo, path}) => (
  <Route
    path={path}
    render={props => test(state)
      ? <Component {...props}/>
      : <Redirect to={redirectTo}/>
    }/>
)

StateCheckRedirectRoute.propTypes = {
  path: Route.propTypes.path,
  test: React.PropTypes.func,
  component: Route.propTypes.component,
  state: React.PropTypes.object.isRequired,
  redirectTo: Redirect.propTypes.to
}

module.exports = StateCheckRedirectRoute
