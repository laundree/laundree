/**
 * Created by budde on 06/11/2016.
 */

const faker = require('faker')
const {timeout, signIn} = require('../../nightwatch_utils.js')
const {UserHandler} = require('../../../test_target/handlers')

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
    signIn(client.url(client.launch_url), email, password)
      .waitForElementVisible('#SignIn .error.notion', timeout)
    client.expect.element('#SignIn .error.notion').text.to.contain('The email provided isn\'t verified.')
    client.end()
  },
  'Can login verified': client => {
    client
      .url(client.launch_url)
    user
      .generateVerifyEmailToken(email)
      .then(token => user.verifyEmail(email, token.secret))
      .then(() => {
        signIn(client, email, password)
          .waitForElementVisible('#CreateLaundry', timeout)
          .end()
      })
  },
/*
  Not relevant anymore
  'Can be marked returning': client => {
    client
      .url(client.launch_url)
    user
      .generateVerifyEmailToken(email)
      .then(token => user.verifyEmail(email, token.secret))
      .then(() => {
        signIn(client, email, password)
          .waitForElementVisible('#CreateLaundry', timeout)
          .click('#TopNav .rightNav .dropDown.user .dropDownTitle img')
          .waitForElementVisible('#TopNav .rightNav .user .dropDownContent', timeout)
          .waitForElementVisible('#TopNav .rightNav .user .dropDownContent', timeout)
          .click('#TopNav .rightNav .user .dropDownContent li:last-of-type a')
          .waitForElementPresent('#Home #Logo', timeout)
          .expect.element('#TopNav .rightNav a.auth.signUp').text.to.match(/[lL][oO][gG] [Ii][nN]/)
        client.end()
      })
  },
*/
  'Can reset password': client => {
    client
      .url(client.launch_url)
      .click('#TopNav a.auth.signUp')
      .waitForElementPresent('#Auth', timeout)
      .click('#Auth  .forgot div:last-of-type a')
      .waitForElementPresent('#ForgotPassword', timeout)
      .setValue('#ForgotPassword input[type=text]', email.toUpperCase())
      .submitForm('#ForgotPassword')
      .waitForElementVisible('#ForgotPassword .notion.success', timeout)
      .end()
  },
  'Can not reset password': client => {
    client
      .url(client.launch_url)
      .click('#TopNav a.auth.signUp')
      .waitForElementPresent('#Auth', timeout)
      .click('#Auth  .forgot div:last-of-type a')
      .waitForElementPresent('#ForgotPassword', timeout)
      .setValue('#ForgotPassword input[type=text]', 'foo' + email.toUpperCase())
      .submitForm('#ForgotPassword')
      .waitForElementVisible('#ForgotPassword .notion.error', timeout)
      .end()
  },
  'Can sign-up': client => {
    const email = faker.internet.email()
    const password = faker.internet.password()
    const name = faker.name.findName()
    client
      .url(client.launch_url)
      .click('#TopNav a.auth.signUp')
      .waitForElementPresent('#Auth form', timeout)
      .setValue('#Auth form label:nth-of-type(1) input', name)
      .setValue('#Auth form label:nth-of-type(2) input', email)
      .setValue('#Auth form label:nth-of-type(3) input', password)
      .submitForm('#Auth form')
      .waitForElementVisible('#Auth form .notion.success', timeout)
      .setValue('#Auth form label:nth-of-type(1) input', name)
      .setValue('#Auth form label:nth-of-type(2) input', email)
      .setValue('#Auth form label:nth-of-type(3) input', password)
      .submitForm('#Auth form')
      .waitForElementVisible('#Auth form .notion.error', timeout)
    client.expect.element('#Auth form .error.notion').text.to.contain('A user with this email already exists')
    client.end()
  }
}
