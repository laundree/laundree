/**
 * Created by budde on 31/10/2016.
 */
const {timeout} = require('../nightwatch_utils.js')

module.exports = {
  'Can load front page': client =>
    client
      .url(client.launch_url)
      .waitForElementVisible('#QuickStart', timeout)
      .end(),
  'Can load about page': client =>
    client
      .url(client.launch_url)
      .click('#TopNav a.about')
      .waitForElementVisible('#About', timeout)
      .end(),
  'Can load contact page': client =>
    client
      .url(client.launch_url)
      .click('#TopNav a.contact')
      .waitForElementVisible('#Contact', timeout)
      .end(),
  'Can load auth page': client =>
    client
      .url(client.launch_url)
      .click('#TopNav a.log-in')
      .waitForElementVisible('#Auth', timeout)
      .waitForElementNotPresent('#TopNav', timeout)
      .end(),
  'Can load forgot page': client =>
    client
      .url(client.launch_url)
      .click('#TopNav a.log-in')
      .waitForElementVisible('#Auth', timeout)
      .click('#Auth a.forgot')
      .waitForElementVisible('#ForgotPassword', timeout)
      .end(),
  'Can load sign-up page': client =>
    client
      .url(client.launch_url)
      .click('#TopNav a.log-in')
      .waitForElementVisible('#Auth', timeout)
      .click('#Auth div.forgot div:last-of-type a')
      .waitForElementVisible('#Auth input[name=email]', timeout)
      .waitForElementVisible('#Auth input[name=name]', timeout)
      .waitForElementVisible('#Auth input[name=password]', timeout)
      .end(),
  'Can load front page from auth': client =>
    client
      .url(client.launch_url)
      .click('#TopNav a.log-in')
      .waitForElementVisible('#Auth', timeout)
      .click('a#Logo')
      .waitForElementVisible('#TopNav', timeout)
      .end()
}
