const faker = require('faker')
const {timeout, setupLaundry} = require('../../nightwatch_utils.js')
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
    setupLaundry(client, email, password)
      .click('#LeftNav ul li:nth-of-type(4) a')
      .waitForElementPresent('#QrSignUp .pdfLink', timeout)
      .click('#QrSignUp .pdfLink')
      .waitForElementVisible('#QrSignUp .qr-download', timeout)
      .click('#QrSignUp .qr-download')
      .pause(timeout)
      .windowHandles(function (result) {
        this.assert.equal(result.value.length, 2)
      })
      .end()
  },
  'Can create invite link': client => {
    setupLaundry(client, email, password)
      .click('#LeftNav ul li:nth-of-type(4) a')
      .waitForElementPresent('#UserLinkSignUp button', timeout)
      .click('#UserLinkSignUp button')
      .waitForElementVisible('#UserLinkSignUp .linkContainer .link', timeout)
      .end()
  },
  'Can create laundry': client => {
    setupLaundry(client, email, password).end()
  }
}
