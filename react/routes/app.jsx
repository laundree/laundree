/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const {Route, IndexRoute, IndexRedirect} = require('react-router')
const {App, LeftNav, CreateLaundry, Home, Forgot, SignUp, Auth, LogIn, Timetable, Bookings, Settings, Machines, Reset} = require('../containers')

function routeGenerator (store) {
  const state = store.getState()
  if (state.currentUser) {
    const checkLaundry = (nextState, replace) => {
      if (!state.currentUser) return
      const laundries = state.users[state.currentUser].laundries
      if (!laundries.length) return
      replace({
        pathname: `/laundries/${laundries[0]}/timetable`
      })
    }

    return [
      <Route component={App} path='/'>
        <IndexRoute component={CreateLaundry} onEnter={checkLaundry}/>
        <Route path='laundries/:id' component={LeftNav}>
          <Route path='timetable' component={Timetable}/>
          <Route path='booking' component={Bookings}/>
          <Route path='settings' component={Settings}/>
          <Route path='machines' component={Machines}/>
        </Route>
      </Route>,
      <Route path='/auth'>
        <IndexRedirect to='/'/>
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
      <Route path='reset' component={Reset}/>
    </Route>]
}

module.exports = routeGenerator
