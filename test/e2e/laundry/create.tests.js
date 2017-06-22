import faker from 'faker'
import { timeout, setupLaundry } from '../../nightwatch_utils.js'
import UserHandler from '../../../test_target/handlers/user'

let email, password, user

module.exports = {
  'beforeEach': async (client, done) => {
    email = faker.internet.email()
    password = faker.internet.password()
    user = await UserHandler
      .lib
      .createUserWithPassword(faker.name.findName(), email, password)
    console.log('User created')
    const token = await user.generateVerifyEmailToken(email)
    await user.verifyEmail(email, token.secret)
    done()
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
