/**
 * Created by budde on 28/05/16.
 */

var Initializer = require('./initializer')

var React = require('react')
var ReactDOM = require('react-dom')
var container = require('../container')
var IntlProvider = require('react-intl').IntlProvider
var Provider = require('react-redux').Provider
var store = require('../store')

class TimetableInitializer extends Initializer {
  setup (element) {
    var timeTableHeader = element.querySelector('#RightContent')
    if (!timeTableHeader) return
    return ReactDOM.render(
      <IntlProvider locale='en'>
        <Provider store={store}>
          <container.Timetable />
        </Provider>
      </IntlProvider>
      , timeTableHeader)
  }
}

module.exports = TimetableInitializer
