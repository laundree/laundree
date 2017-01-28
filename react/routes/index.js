/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const {Route, IndexRoute, IndexRedirect} = require('react-router')
const Users = require('../containers/Users')
const App = require('../containers/App')
const LeftNav = require('../containers/LeftNav')
const HomeLoggedIn = require('../containers/HomeLoggedIn')
const Home = require('../views/Home')
const Forgot = require('../views/Forgot')
const SignUp = require('../containers/SignUp')
const Auth = require('../containers/Auth')
const Login = require('../containers/Login')
const Timetable = require('../containers/Timetable')
const Bookings = require('../containers/Bookings')
const LaundrySettings = require('../containers/LaundrySettings')
const Machines = require('../containers/Machines')
const Reset = require('../views/Reset')
const Verification = require('../views/Verification')
const Privacy = require('../views/Privacy')
const TermsAndConditions = require('../views/TermsAndConditions')
const UserSettings = require('../containers/UserSettings')
const About = require('../views/About')
const Support = require('../containers/Support')
const Contact = require('../views/Contact')
const UserLoader = require('../containers/UserLoader')

function adminCheck (user) {
  return user && user.role === 'admin'
}

function checkLaundryGenerator (store) {
  return (state, replace) => {
    const {currentUser, users} = store.getState()
    if (!currentUser) return
    const user = users[currentUser]
    if (user.role === 'admin') return
    const laundries = user.laundries
    if (!laundries.length) return
    replace({
      pathname: `/laundries/${laundries[0]}/timetable`
    })
  }
}

function checkExistingLaundryGenerator (store) {
  return checkGenerator(store, ({laundry, admin}) => admin || laundry)
}

function checkExistingUserGenerator (store) {
  return checkGenerator(store, ({user, admin}) => admin || user)
}

function checkLaundryOwnerGenerator (store) {
  return checkGenerator(store, ({laundry, admin}, {currentUser, users}) => admin || laundry && laundry.owners.indexOf(currentUser) >= 0)
}

function checkSelfGenerator (store) {
  return checkGenerator(store, ({user, admin}, {currentUser, users}) => admin || (user && user.id === currentUser))
}

function checkGenerator (store, check) {
  return (state, replace, callback) => {
    const reduxState = store.getState()
    const {laundries, users} = reduxState
    const {params: {laundryId, userId}} = state
    const laundry = laundries[laundryId]
    const user = users[userId]
    const admin = adminCheck(reduxState.users[reduxState.currentUser])
    if (check({laundry, user, admin}, reduxState)) return callback()
    const error = new Error('Not found')
    error.status = 404
    callback(error)
  }
}

function routeGenerator (store) {
  const state = store.getState()

  if (state.currentUser) {
    return [
      <Route component={App} path='/'>
        <IndexRoute component={HomeLoggedIn} onEnter={checkLaundryGenerator(store)}/>
        <Route path='laundries/:laundryId' component={LeftNav} onEnter={checkExistingLaundryGenerator(store)}>
          <IndexRedirect to='timetable'/>
          <Route path='timetable' component={Timetable}/>
          <Route path='bookings' component={Bookings}/>
          <Route path='settings' component={LaundrySettings}/>
          <Route path='machines' component={Machines} onEnter={checkLaundryOwnerGenerator(store)}/>
          <Route path='users' component={Users} onEnter={checkLaundryOwnerGenerator(store)}/>
        </Route>
        <Route path='/support' component={Support}/>
        <Route path='/users/:userId' component={UserLoader} onEnter={checkExistingUserGenerator(store)}>
          <IndexRedirect to='settings'/>
          <Route path='settings' component={UserSettings} onEnter={checkSelfGenerator(store)}/>
        </Route>
      </Route>,
      <Route path='/privacy' component={Privacy}/>,
      <Route path='/terms-and-conditions' component={TermsAndConditions}/>,
      <Route path='/contact'>
        <IndexRedirect to='/support'/>
      </Route>,
      <Route path='/auth'>
        <IndexRedirect to='/'/>
      </Route>]
  }
  return [
    <Route component={App} path='/'>
      <IndexRoute component={Home}/>
      <Route path='about' component={About}/>
      <Route path='contact' component={Contact}/>
    </Route>,
    <Route path='/laundries/*'>
      <IndexRedirect to='/auth'/>
    </Route>,
    <Route path='/support'>
      <IndexRedirect to='/auth'/>
    </Route>,
    <Route path='/privacy' component={Privacy}/>,
    <Route path='/terms-and-conditions' component={TermsAndConditions}/>,
    <Route path='/auth' component={Auth}>
      <IndexRoute component={Login}/>
      <Route path='forgot' component={Forgot}/>
      <Route path='sign-up' component={SignUp}/>
      <Route path='reset' component={Reset}/>
      <Route path='verification' component={Verification}/>
    </Route>]
}

module.exports = routeGenerator
