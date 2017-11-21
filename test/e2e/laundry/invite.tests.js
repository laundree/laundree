import faker from 'faker'
import { timeout } from '../../nightwatch_utils'
import UserHandler from '../../../test_target/handlers/user'
import LaundryHandler from '../../../test_target/handlers/laundry'

let lName, link

module.exports = {
  'beforeEach': async (client, done) => {
    lName = faker.company.companyName()

    const email2 = faker.internet.email()
    const user = await UserHandler
      .lib
      .createUserWithPassword(faker.name.findName(), email2, faker.internet.password())
    const laundry = await LaundryHandler
      .lib
      .createLaundry(user, lName, 'Europe/Copenhagen', 'ChIJs4G9sJQ_TEYRHG0LNOr0w-I')
    link = client.launch_url + 's/' + laundry.shortId() + '/' + (await laundry.createInviteCode())
    done()
  },
  'can open invite link and add to existing user': async (client) => {
    const email = faker.internet.email()
    const password = faker.internet.password()
    const user = await UserHandler
      .lib
      .createUserWithPassword(faker.name.findName(), email, password)
    const token = await user.generateVerifyEmailToken(email)
    await user.verifyEmail(email, token.secret)
    client.url(link)
      .waitForElementPresent('#Auth h1', timeout)
    client.assert.containsText('#Auth h1', lName)
    client
      .click('#Auth .forgot a')
      .waitForElementPresent('#SignIn', timeout)
      .setValue('#SignIn label:nth-of-type(1) input', email)
      .setValue('#SignIn label:nth-of-type(2) input', password)
      .submitForm('#SignIn')
      .waitForElementPresent('#TopNav .laundries div span', timeout)
    client.assert.containsText('#TopNav .laundries div span', lName)
    client.end()
  },
  'can invite new user': async (client) => {
    const name = faker.name.findName()
    const email = faker.internet.email()
    const password = faker.internet.password()
    client.url(link)
      .waitForElementPresent('#Auth h1', timeout)
    client.assert.containsText('#Auth h1', lName)
    client
      .waitForElementPresent('.signUpForm', timeout)
      .setValue('.signUpForm label:nth-of-type(1) input', name)
      .setValue('.signUpForm label:nth-of-type(2) input', email)
      .setValue('.signUpForm label:nth-of-type(3) input', password)
      .setValue('.signUpForm label:nth-of-type(4) input', password)
      .submitForm('.signUpForm')
      .waitForElementPresent('.signUpForm .notion.success', timeout)
      .perform(async (done) => {
        const user = await UserHandler.lib.findFromEmail(email.toLowerCase())
        const token = await user.generateVerifyEmailToken(email)
        await user.verifyEmail(email, token.secret)
        done()
      })
      .url(client.launch_url)
      .click('#TopNav .auth.signUp')
      .waitForElementPresent('#SignIn', timeout)
      .setValue('#SignIn label:nth-of-type(1) input', email)
      .setValue('#SignIn label:nth-of-type(2) input', password)
      .submitForm('#SignIn')
      .waitForElementPresent('#TopNav .laundries div span', timeout)
    client.assert.containsText('#TopNav .laundries div span', lName)
    client.end()
  }
}
