const faker = require('faker')
const {timeout} = require('../../nightwatch_utils.js')
const {UserHandler} = require('../../../handlers')

let email, password, laundry

function setup (client) {
  return client
    .url(client.launch_url)
    .click('#TopNav a.log-in')
    .waitForElementPresent('#SignIn', timeout)
    .setValue('#SignIn label:nth-of-type(1) input', email)
    .setValue('#SignIn label:nth-of-type(2) input', password)
    .submitForm('#SignIn')
    .waitForElementVisible('#LeftNav', timeout * 5)
    .click('#LeftNav ul:last-of-type li:first-of-type')
    .waitForElementPresent('#LaundrySettingsNameOrPlace', timeout)
}

module.exports = {
  'beforeEach': (client, done) => {
    email = faker.internet.email()
    password = faker.internet.password()
    UserHandler.createUserWithPassword(faker.name.findName(), email, password)
      .then(u => {
        return u.generateVerifyEmailToken(email)
          .then(token => u.verifyEmail(email, token.secret))
          .then(() => u.createLaundry(faker.name.findName()))
          .then(l => {
            laundry = l
          })
      })
      .then(() => done(), err => console.log(err))
  },
  'Can go to settings': client => {
    setup(client).end()
  },
  'Can change name': client => {
    const name = faker.name.findName()
    setup(client)
      .waitForElementPresent('#LaundrySettingsNameOrPlace form label > input[type=text]', timeout)
      .setValue('#LaundrySettingsNameOrPlace form label > input[type=text]', name)
      .submitForm('#LaundrySettingsNameOrPlace form')
      .pause(timeout)
    client.assert.containsText('#TopNav .laundries span', name)
    client
      .end()
  },
  'Can change country': client => {
    const name = 'Germany'
    setup(client)
      .waitForElementPresent('#LaundrySettingsNameOrPlace form .locationSelector input[type=text]', timeout)
      .pause(timeout)
      .clearValue('#LaundrySettingsNameOrPlace form .locationSelector input[type=text]')
      .setValue('#LaundrySettingsNameOrPlace form .locationSelector input[type=text]', name)
      .waitForElementVisible('#LaundrySettingsNameOrPlace form .locationSelector .dropDownContent ul li span', timeout * 5)
      .click('#LaundrySettingsNameOrPlace form .locationSelector .dropDownContent ul li span')
      .submitForm('#LaundrySettingsNameOrPlace form')
      .pause(timeout)
      .url(`${client.launch_url}laundries/${laundry.model.id}/settings`)
      .pause(timeout)
    client.assert.valueContains('#LaundrySettingsNameOrPlace form .locationSelector input[type=text]', name)
    client.end()
  }
}
