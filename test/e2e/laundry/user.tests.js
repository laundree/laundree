import faker from 'faker'
import {timeout, signIn} from '../../nightwatch_utils.js'
import UserHandler from '../../../test_target/handlers/user'

let email, password, user, laundry

module.exports = {
  'beforeEach': (client, done) => {
    email = faker.internet.email()
    password = faker.internet.password()
    Promise
      .all([
        UserHandler.lib.createUserWithPassword(faker.name.findName(), email, password),
        UserHandler.lib.createUserWithPassword(faker.name.findName(), faker.internet.email().toUpperCase(), password)
      ])
      .then(([u, owner]) => {
        user = u
        return user.generateVerifyEmailToken(email)
          .then(token => user.verifyEmail(email, token.secret))
          .then(() => owner.createLaundry(faker.name.findName()))
          .then(l => {
            laundry = l
            return l.addUser(u)
          })
      })
      .then(() => done(), err => console.log(err))
  },
  'Can not access forbidden page': client => {
    signIn(client
      .url(client.launch_url), email, password)
      .waitForElementVisible('#LeftNav', timeout * 5)
      .url(`${client.launch_url}laundries/${laundry.model.id}/users`)
      .waitForElementVisible('#NotFound', timeout)
      .end()
  }
}
