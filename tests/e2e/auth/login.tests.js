/**
 * Created by budde on 06/11/2016.
 */

const faker = require('faker')
const {timeout} = require('../../nightwatch_utils.js')
const {UserHandler} = require('../../../handlers')

let email, password, user

module.exports = {
  'before': (client, done) => {
    email = faker.internet.email()
    password = faker.internet.password()
    UserHandler
      .createUserWithPassword(faker.name.findName(), email, password)
      .then(u => {
        user = u
        done()
      })
  },
  'Can not login un-verified': client => {
    client
      .url(client.launch_url)
      .click('#TopNav a.log-in')
      .waitForElementPresent('#SignIn', timeout)
      .setValue('#SignIn label:nth-of-type(1) input', email)
      .setValue('#SignIn label:nth-of-type(2) input', password)
      .submitForm('#SignIn')
      .waitForElementVisible('#SignIn .error.notion', timeout)
    client.expect.element('#SignIn .error.notion').text.to.contain('The email provided isn\'t verified.')
    client.end()
  },
  'Can login verified': client => {
    client
      .url(client.launch_url)
    user
      .generateVerifyEmailToken(email)
      .then(token => user.verifyEmail(email, token))
      .then(() => {
        client
          .click('#TopNav a.log-in')
          .waitForElementPresent('#SignIn', timeout)
          .setValue('#SignIn label:nth-of-type(1) input', email)
          .setValue('#SignIn label:nth-of-type(2) input', password)
          .submitForm('#SignIn')
          .waitForElementVisible('#CreateLaundry', timeout)
          .end()
      })
  },
  'Can reset password': client => {
    client
      .url(client.launch_url)
      .click('#TopNav a.log-in')
      .waitForElementPresent('#SignIn', timeout)
      .click('#SignIn a.forgot')
      .waitForElementPresent('#ForgotPassword', timeout)
      .setValue('#ForgotPassword input[type=text]', email.toUpperCase())
      .submitForm('#ForgotPassword')
      .waitForElementVisible('#ForgotPassword .notion.success', timeout)
      .end()
  },
  'Can not reset password': client => {
    client
      .url(client.launch_url)
      .click('#TopNav a.log-in')
      .waitForElementPresent('#SignIn', timeout)
      .click('#SignIn a.forgot')
      .waitForElementPresent('#ForgotPassword', timeout)
      .setValue('#ForgotPassword input[type=text]', 'foo' + email.toUpperCase())
      .submitForm('#ForgotPassword')
      .waitForElementVisible('#ForgotPassword .notion.error', timeout)
      .end()
  }
}
