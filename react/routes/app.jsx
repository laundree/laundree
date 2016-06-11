/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const {Route, IndexRoute, IndexRedirect} = require('react-router')
const {App, Home, Forgot, SignUp, Auth, LogIn, Timetable, Bookings, Settings, Account} = require('../containers')

function routeGenerator (store) {
  const state = store.getState()
  if (state.currentUser) {
    return [
      <Route component={App} path='/'>
        <Route path='timetable'>
          <Route path=':id' component={Timetable}/>
        </Route>
        <Route path='accounts'>
          <Route path=':id' component={Account}/>
        </Route>
        <Route path='bookings' component={Bookings}/>
        <Route path='settings' component={Settings}/>
      </Route>,
      <Route path='/auth'>
        <IndexRedirect to='/' />
      </Route>]
  }
  return [
    <Route component={App} path='/'>
      <IndexRoute component={Home}/>
    </Route>,
    <Route path='/auth' component={Auth}>
      <IndexRoute component={LogIn}/>
      <Route path='forgot' component={Forgot}/>
      <Route path='sign-up' component={SignUp}/>
    </Route>]
}

module.exports = routeGenerator
