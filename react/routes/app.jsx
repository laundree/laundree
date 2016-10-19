/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const {Route, IndexRoute, IndexRedirect} = require('react-router')
const {
  Users, App, LeftNav, HomeLoggedIn, Home, Forgot, SignUp, Auth,
  LogIn, Timetable, Bookings, LaundrySettings, Machines, Reset, Verification,
  Privacy, TermsAndConditions, UserSettings, About, Support, Contact
} = require('../containers')

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
  return checkGenerator(store, ({laundry}) => laundry)
}

function checkExistingUserGenerator (store) {
  return checkGenerator(store, ({user}) => user)
}

function checkLaundryOwnerGenerator (store) {
  return checkGenerator(store, ({laundry}, {currentUser, users}) => {
    const user = users[currentUser]
    if (!user) return false
    if (user.role === 'admin') return true
    return laundry && laundry.owners.indexOf(currentUser) >= 0
  })
}

function checkSelfGenerator (store) {
  return checkGenerator(store, ({user}, {currentUser, users}) => {
    const currentUserObj = users[currentUser]
    if (!currentUserObj) return false
    if (currentUserObj.role === 'admin') return true
    return user && user.id === currentUser
  })
}

function checkGenerator (store, check) {
  return (state, replace, callback) => {
    const reduxState = store.getState()
    const {laundries, users} = reduxState
    const {params: {laundryId, userId}} = state
    const laundry = laundries[laundryId]
    const user = users[userId]
    if (check({laundry, user}, reduxState)) return callback()
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
        <Route path='/users/:userId' onEnter={checkExistingUserGenerator(store)}>
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
      <IndexRoute component={LogIn}/>
      <Route path='forgot' component={Forgot}/>
      <Route path='sign-up' component={SignUp}/>
      <Route path='reset' component={Reset}/>
      <Route path='verification' component={Verification}/>
    </Route>]
}

module.exports = routeGenerator
