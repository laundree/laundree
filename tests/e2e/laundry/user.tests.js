const faker = require('faker')
const {timeout} = require('../../nightwatch_utils.js')
const {UserHandler} = require('../../../handlers')

let email, password, user, laundry

module.exports = {
  'beforeEach': (client, done) => {
    email = faker.internet.email()
    password = faker.internet.password()
    Promise
      .all([
        UserHandler.createUserWithPassword(faker.name.findName(), email, password),
        UserHandler.createUserWithPassword(faker.name.findName(), faker.internet.email().toUpperCase(), password)
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
    client
      .url(client.launch_url)
      .click('#TopNav a.log-in')
      .waitForElementPresent('#SignIn', timeout)
      .setValue('#SignIn label:nth-of-type(1) input', email)
      .setValue('#SignIn label:nth-of-type(2) input', password)
      .submitForm('#SignIn')
      .waitForElementVisible('#LeftNav', timeout * 5)
      .url(`${client.launch_url}/laundries/${laundry.model.id}/users`)
      .waitForElementVisible('#NotFound', timeout)
      .end()
  }
}
