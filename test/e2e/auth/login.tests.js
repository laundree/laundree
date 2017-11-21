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
  },
  'Can sign-up from landing page': client => {
    const email = faker.internet.email()
    const password = faker.internet.password()
    const name = faker.name.findName()
    client
      .url(client.launch_url)
      .waitForElementPresent('#LandingPage', timeout)
      .click('#LandingPage .intro .signUpChooser div:nth-of-type(2)')
      .setValue('#LandingPage .intro form.signUpForm label:nth-of-type(1) input', name)
      .setValue('#LandingPage .intro form.signUpForm label:nth-of-type(2) input', email)
      .setValue('#LandingPage .intro form.signUpForm label:nth-of-type(3) input', password)
      .setValue('#LandingPage .intro form.signUpForm label:nth-of-type(4) input', password)
      .submitForm('#LandingPage .intro form.signUpForm')
      .waitForElementVisible('#LandingPage .intro form.signUpForm .notion.success', timeout)
      .setValue('#LandingPage .intro form.signUpForm label:nth-of-type(1) input', name)
      .setValue('#LandingPage .intro form.signUpForm label:nth-of-type(2) input', email)
      .setValue('#LandingPage .intro form.signUpForm label:nth-of-type(3) input', password)
      .setValue('#LandingPage .intro form.signUpForm label:nth-of-type(4) input', password)
      .submitForm('#LandingPage .intro form.signUpForm')
      .waitForElementVisible('#LandingPage .intro form.signUpForm .notion.error', timeout)
    client.expect.element('#LandingPage .intro form.signUpForm .notion.error').text.to.contain('A user with this email already exists')
    client.end()
  },
  'Can sign-up with laundry': client => {
    const email = faker.internet.email()
    const password = faker.internet.password()
    const name = faker.name.findName()
    const laundryName = faker.company.companyName()
    client
      .url(client.launch_url)
      .waitForElementPresent('#LandingPage', timeout)
      .setValue('#LandingPage .intro form.signUpForm label:nth-of-type(1) input', name)
      .setValue('#LandingPage .intro form.signUpForm label:nth-of-type(2) input', email)
      .setValue('#LandingPage .intro form.signUpForm label:nth-of-type(3) input', password)
      .setValue('#LandingPage .intro form.signUpForm label:nth-of-type(4) input', password)
      .submitForm('#LandingPage .intro form.signUpForm')
      .waitForElementVisible('#LandingPage .intro form.signUpForm.invalid', timeout)
      .setValue('#LandingPage .intro form.signUpForm div:nth-child(5) label:nth-child(1) input', laundryName)
      .setValue('#LandingPage .intro form.signUpForm div:nth-child(5) label:nth-child(2) input', 'cuba')
      .waitForElementVisible('#LandingPage .intro form.signUpForm .locationSelector .dropDownContent ul li span', timeout * 5)
      .click('#LandingPage .intro form.signUpForm .locationSelector .dropDownContent ul li span')
      .submitForm('#LandingPage .intro form.signUpForm')
      .waitForElementVisible('#LandingPage .intro form.signUpForm .notion.success', timeout)
    client.end()
  }
}

