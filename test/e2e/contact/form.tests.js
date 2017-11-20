/**
 * Created by budde on 05/11/2016.
 */

import faker from 'faker'
import {timeout} from '../../nightwatch_utils.js'

module.exports = {
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
      .end()
}
// TODO test support

