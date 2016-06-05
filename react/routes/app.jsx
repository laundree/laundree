/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const {Route, IndexRedirect} = require('react-router')
const {App, Timetable, Bookings, Settings, Account} = require('../views')

const AppRoute = <Route path='/app' component={App}>
  <Route path='timetable'>
    <Route path=':id' component={Timetable}/>
  </Route>
  <Route path='accounts'>
    <Route path=':id' component={Account}/>
  </Route>
  <Route path='bookings' component={Bookings}/>
  <Route path='settings' component={Settings}/>
</Route>

module.exports = AppRoute
