/**
 * Created by budde on 05/11/2016.
 */

import faker from 'faker'
import { timeout, signIn } from '../../nightwatch_utils.js'
import UserHandler from '../../../test_target/handlers/user'

let email, password, user

module.exports = {
  'beforeEach': async (client, done) => {
    email = faker.internet.email()
    password = faker.internet.password()
    user = await UserHandler
      .lib
      .createUserWithPassword(faker.name.findName(), email, password)
    const token = await user.generateVerifyEmailToken(email)
    await user.verifyEmail(email, token.secret)
    done()
  },
  'Can load contact page': client =>
    client
      .url(client.launch_url)
      .click('#TopNav a.contact')
      .waitForElementVisible('#ContactSection', timeout)
      .setValue('#ContactSection form.contactForm label:nth-of-type(1) input[type=text]', faker.name.findName())
      .setValue('#ContactSection form.contactForm label:nth-of-type(2) input[type=text]', faker.internet.email())
      .setValue('#ContactSection form.contactForm label:nth-of-type(3) input[type=text]', faker.lorem.words(4))
      .setValue('#ContactSection form.contactForm textarea', faker.lorem.words(15))
      .submitForm('#ContactSection form')
      .waitForElementVisible('div.contactForm.sent', timeout)
      .end(),
  'Can submit support': client => {
    signIn(client.url(client.launch_url), email, password)
      .click('#TopNav > a.icon.help')
      .waitForElementPresent('#Support .contactForm', timeout)
      .setValue('#Support form.contactForm label:nth-of-type(1) input[type=text]', faker.internet.email())
      .setValue('#Support form.contactForm textarea', faker.lorem.words(15))
      .submitForm('#Support form')
      .waitForElementVisible('div.contactForm.sent', timeout)
      .end()
  }
}

