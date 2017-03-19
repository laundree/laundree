const faker = require('faker')
const {timeout, signIn} = require('../../nightwatch_utils.js')
const {UserHandler} = require('../../../handlers')

let email, password

function setup (client) {
  return signIn(client.url(client.launch_url), email, password)
    .waitForElementVisible('#LeftNav', timeout * 5)
    .click('#LeftNav ul li:nth-of-type(3)')
    .waitForElementPresent('#LaundryMain .create_machine', timeout)
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
          .then(l => l.createMachine('M1', 'wash', true))
      })
      .then(() => done(), err => console.log(err))
  },
  'Can mark machine broken': client => {
    setup(client)
      .click('.machine_list li:last-of-type .repair svg')
      .waitForElementPresent('.machine_list li:last-of-type .broken', timeout)
      .click('.machine_list li:last-of-type .repair svg')
      .waitForElementNotPresent('.machine_list li:last-of-type .broken', timeout)
      .end()
  },
  'Can go to machines': client => {
    setup(client).end()
  },
  'Can create machine': client => {
    const name = faker.name.findName()
    setup(client)
      .waitForElementPresent('#LaundryMain .create_machine .machineForm input[type=text]', timeout)
      .setValue('#LaundryMain .create_machine .machineForm input[type=text]', name)
      .submitForm('#LaundryMain .create_machine .machineForm')
      .waitForElementPresent('#LaundryMain .machine_list li:nth-of-type(3) ', timeout)
    client.assert.valueContains('#LaundryMain .machine_list li:nth-of-type(3) input[type=text]', name)
    client
      .end()
  }
}
