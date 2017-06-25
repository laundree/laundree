import faker from 'faker'
import {timeout, signIn} from '../../nightwatch_utils.js'
import UserHandler from '../../../test_target/handlers/user'

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
    UserHandler.lib.createUserWithPassword(faker.name.findName(), email, password)
      .then(u => {
        return u.generateVerifyEmailToken(email)
          .then(token => u.verifyEmail(email, token.secret))
          .then(() => u.createLaundry(faker.name.findName()))
          .then(l => l.createMachine('M1', 'wash', false))
      })
      .then(() => done(), err => console.log(err))
  },
  'Can mark machine broken': client => {
    setup(client)
      .waitForElementPresent('.machine_list li .repair svg', timeout)
      .click('.machine_list li .repair svg')
      .waitForElementPresent('.machine_list li .broken', timeout)
      .waitForElementPresent('.machine_list li .repair svg', timeout)
      .click('.machine_list li .repair svg')
      .waitForElementPresent('.machine_list li .machineForm:not(.broken)', timeout)
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
      .waitForElementPresent('#LaundryMain .machine_list li:nth-of-type(2) ', timeout)
    client.assert.valueContains('#LaundryMain .machine_list li:nth-of-type(2) input[type=text]', name)
    client
      .end()
  }
}
