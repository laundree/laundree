/**
 * Created by budde on 31/10/2016.
 */
import connectMongoose from '../test_target/db/mongoose'
import faker from 'faker'
import config from 'config'

connectMongoose()

const timeout = config.get('sauceLabs.timeout')

function signIn (client, username, password) {
  return client
    .click('#TopNav a.auth.signUp')
    .waitForElementPresent('#Auth', timeout)
    .click('#Auth .forgot div:first-of-type a')
    .waitForElementPresent('#SignIn', timeout)
    .setValue('#SignIn label:nth-of-type(1) input', username)
    .setValue('#SignIn label:nth-of-type(2) input', password)
    .submitForm('#SignIn')
}

function setupLaundry (client, email, password) {
  return signIn(client
    .url(client.launch_url), email, password)
    .waitForElementVisible('#CreateLaundry', timeout)
    .click('#CreateLaundry .expand_button button')
    .waitForElementVisible('#CreateLaundry form label > input[type=text]', timeout)
    .setValue('#CreateLaundry form label > input[type=text]', faker.company.companyName())
    .setValue('#CreateLaundry form .locationSelector input[type=text]', 'cuba')
    .waitForElementVisible('#CreateLaundry form .locationSelector .dropDownContent ul li span', timeout * 5)
    .click('#CreateLaundry form .locationSelector .dropDownContent ul li span')
    .submitForm('#CreateLaundry form')
    .waitForElementVisible('#TopNav .laundries', timeout)
    .waitForElementVisible('#LeftNav', timeout)
}

module.exports = {
  setupLaundry,
  signIn,
  timeout
}
