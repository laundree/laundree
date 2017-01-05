const faker = require('faker')
const {timeout} = require('../../nightwatch_utils.js')
const {UserHandler} = require('../../../handlers')

let email, password, user

module.exports = {
  'beforeEach': (client, done) => {
    email = faker.internet.email()
    password = faker.internet.password()
    UserHandler
      .createUserWithPassword(faker.name.findName(), email, password)
      .then(u => {
        user = u
        return user.generateVerifyEmailToken(email).then(token => user.verifyEmail(email, token.secret))
      })
      .then(() => done())
  },
  'Can create invite PDF': client => {
    client
      .url(client.launch_url)
      .click('#TopNav a.log-in')
      .waitForElementPresent('#SignIn', timeout)
      .setValue('#SignIn label:nth-of-type(1) input', email)
      .setValue('#SignIn label:nth-of-type(2) input', password)
      .submitForm('#SignIn')
      .waitForElementVisible('#CreateLaundry', timeout)
      .click('#CreateLaundry .expand_button button')
      .waitForElementVisible('#CreateLaundry form input[type=text]', timeout)
      .setValue('#CreateLaundry form input[type=text]', faker.company.companyName())
      .submitForm('#CreateLaundry form')
      .waitForElementVisible('#TopNav .laundries', timeout)
      .waitForElementVisible('#LeftNav', timeout)
      .click('#LeftNav ul li:nth-of-type(4) a')
      .click('#QrSignUp a.pdfLink')
      .pause(timeout)
      .window_handles(function (result) {
        this.assert.equal(result.value.length, 2)
      })
      .end()
  },
  'Can create laundry': client => {
    client
      .url(client.launch_url)
      .click('#TopNav a.log-in')
      .waitForElementPresent('#SignIn', timeout)
      .setValue('#SignIn label:nth-of-type(1) input', email)
      .setValue('#SignIn label:nth-of-type(2) input', password)
      .submitForm('#SignIn')
      .waitForElementVisible('#CreateLaundry', timeout)
      .click('#CreateLaundry .expand_button button')
      .waitForElementVisible('#CreateLaundry form input[type=text]', timeout)
      .setValue('#CreateLaundry form input[type=text]', faker.company.companyName())
      .submitForm('#CreateLaundry form')
      .waitForElementVisible('#TopNav .laundries', timeout)
      .waitForElementVisible('#LeftNav', timeout)
      .end()
  }
}
