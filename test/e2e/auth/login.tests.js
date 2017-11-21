/**
 * Created by budde on 06/11/2016.
 */

import faker from 'faker'
import { timeout, signIn } from '../../nightwatch_utils.js'
import UserHandler from '../../../test_target/handlers/user'

let email, password, user

module.exports = {
  'before': async (client, done) => {
    email = faker.internet.email()
    password = faker.internet.password()
    user = await UserHandler
      .lib
      .createUserWithPassword(faker.name.findName(), email, password)
    done()
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
  'Can reset password': client => {
    client
      .url(client.launch_url)
      .click('#TopNav a.auth.signUp')
      .waitForElementPresent('#Auth', timeout)
      .click('#Auth  .forgot div:first-of-type a')
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
      .click('#Auth  .forgot div:first-of-type a')
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
      .waitForElementPresent('#Auth', timeout)
      .click('#Auth  .forgot div:last-of-type a')
      .waitForElementPresent('#Auth form', timeout)
      .setValue('#Auth form label:nth-of-type(1) input', name)
      .setValue('#Auth form label:nth-of-type(2) input', email)
      .setValue('#Auth form label:nth-of-type(3) input', password)
      .setValue('#Auth form label:nth-of-type(4) input', password)
      .submitForm('#Auth form')
      .waitForElementVisible('#Auth form .notion.success', timeout)
      .setValue('#Auth form label:nth-of-type(1) input', name)
      .setValue('#Auth form label:nth-of-type(2) input', email)
      .setValue('#Auth form label:nth-of-type(3) input', password)
      .setValue('#Auth form label:nth-of-type(4) input', password)
      .submitForm('#Auth form')
      .waitForElementVisible('#Auth form .notion.error', timeout)
    client.expect.element('#Auth form .error.notion').text.to.contain('A user with this email already exists')
    client.end()
  }
}

// TODO test invite flow
