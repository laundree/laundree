import faker from 'faker'
import { timeout, signIn } from '../../nightwatch_utils.js'
import UserHandler from '../../../test_target/handlers/user'

let email, password, email2, password2, user2, user, laundry, inviteCode

module.exports = {
  'beforeEach': async (client, done) => {
    email = faker.internet.email()
    password = faker.internet.password()
    email2 = faker.internet.email()
    password2 = faker.internet.password()
    user = await UserHandler.lib.createUserWithPassword(faker.name.findName(), email, password)
    user2 = await UserHandler.lib.createUserWithPassword(faker.name.findName(), email2, password2)
    const owner = await UserHandler.lib.createUserWithPassword(faker.name.findName(), faker.internet.email().toUpperCase(), password)
    await user.verifyEmail(email, (await user.generateVerifyEmailToken(email)).secret)
    await user2.verifyEmail(email2, (await user2.generateVerifyEmailToken(email2)).secret)
    laundry = await await owner.createLaundry(faker.name.findName())
    await laundry.addUser(user)
    inviteCode = await await laundry.createInviteCode()
    done()
  },
  'Can not access forbidden page':
    client => {
      signIn(client
        .url(client.launch_url), email, password)
        .waitForElementVisible('#LeftNav', timeout * 5)
        .url(`${client.launch_url}laundries/${laundry.model.id}/users`)
        .waitForElementVisible('#NotFound', timeout)
        .end()
    },
  'Can follow invite link when already user':
    client => {
      signIn(client
        .url(client.launch_url), email, password)
        .waitForElementVisible('#LeftNav', timeout * 5)
        .url(`${client.launch_url}s/${laundry.shortId()}/${inviteCode}`)
        .waitForElementVisible('#LeftNav', timeout)
        .end()
    },
  'Can follow invite link when not user':
    client => {
      signIn(client
        .url(client.launch_url), email2, password2)
        .waitForElementVisible('#CreateLaundry', timeout * 5)
        .url(`${client.launch_url}s/${laundry.shortId()}/${inviteCode}`)
        .waitForElementVisible('#LeftNav', timeout)
        .end()
    }
}
