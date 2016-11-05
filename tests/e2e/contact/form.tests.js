/**
 * Created by budde on 05/11/2016.
 */

const faker = require('faker')
const {timeout} = require('../../nightwatch_utils.js')

module.exports = {
  'Can load contact page': client =>
    client
      .url(client.launch_url)
      .click('#TopNav a.contact')
      .waitForElementPresent('#Contact', timeout)
      .setValue('#Contact form.contactForm label:nth-of-type(1) input[type=text]', faker.name.findName())
      .setValue('#Contact form.contactForm label:nth-of-type(2) input[type=text]', faker.internet.email())
      .setValue('#Contact form.contactForm label:nth-of-type(3) input[type=text]', faker.lorem.words(4))
      .setValue('#Contact form.contactForm textarea', faker.lorem.words(15))
      .submitForm('#Contact form')
      .waitForElementVisible('div.contactForm.sent', timeout)
      .end()
}
