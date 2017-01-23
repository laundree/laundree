const faker = require('faker')
const {timeout} = require('../../nightwatch_utils.js')
const {UserHandler} = require('../../../handlers')

let email, password, user

function setupLaundry (client) {
  return client
    .url(client.launch_url)
    .click('#TopNav a.log-in')
    .waitForElementPresent('#SignIn', timeout)
    .setValue('#SignIn label:nth-of-type(1) input', email)
    .setValue('#SignIn label:nth-of-type(2) input', password)
    .submitForm('#SignIn')
    .waitForElementVisible('#CreateLaundry', timeout)
    .click('#CreateLaundry .expand_button button')
    .waitForElementVisible('#CreateLaundry form label > input[type=text]', timeout)
    .setValue('#CreateLaundry form label > input[type=text]', faker.company.companyName())
    .setValue('#CreateLaundry form .locationSelector input[type=text]', faker.address.country())
    .waitForElementVisible('#CreateLaundry form .locationSelector .dropDownContent ul li span', timeout * 5)
    .click('#CreateLaundry form .locationSelector .dropDownContent ul li span')
    .submitForm('#CreateLaundry form')
    .waitForElementVisible('#TopNav .laundries', timeout)
    .waitForElementVisible('#LeftNav', timeout)
}

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
    setupLaundry(client)
      .click('#LeftNav ul li:nth-of-type(4) a')
      .waitForElementPresent('#QrSignUp .pdfLink', timeout)
      .click('#QrSignUp .pdfLink')
      .waitForElementVisible('#QrSignUp .qr-download', timeout)
      .click('#QrSignUp .qr-download')
      .pause(timeout)
      .window_handles(function (result) {
        this.assert.equal(result.value.length, 2)
      })
      .end()
  },
  'Can create invite link': client => {
    setupLaundry(client)
      .click('#LeftNav ul li:nth-of-type(4) a')
      .waitForElementPresent('#UserLinkSignUp button', timeout)
      .click('#UserLinkSignUp button')
      .waitForElementVisible('#UserLinkSignUp .linkContainer .link', timeout)
      .end()
  },
  'Can create laundry': client => {
    setupLaundry(client).end()
  }
}
