/**
 * Created by budde on 01/12/2016.
 */
const {timeout} = require('../../nightwatch_utils.js')

module.exports = {
  'Can change locale on home page': client => {
    client
      .url(client.launch_url)
      .waitForElementPresent('#TopNav .language .dropDownTitle', timeout)
      .click('#TopNav .language .dropDownTitle')
      .waitForElementVisible('#TopNav .language .dropDownContent', timeout)
      .click('#TopNav .language .dropDownContent li:nth-of-type(2) a')
      .waitForElementVisible('#Home header h2', timeout)
      .expect.element('#Home header h2').text.to.contain('nemt og gratis')
    client.end()
  },
  'Can change locale on auth': client => {
    client
      .url(client.launch_url)
      .waitForElementPresent('#TopNav a.log-in', timeout)
      .click('#TopNav a.log-in')
      .waitForElementPresent('#AuthNav .language .dropDownTitle', timeout)
      .click('#AuthNav .language .dropDownTitle')
      .waitForElementVisible('#AuthNav .language .dropDownContent', timeout)
      .click('#AuthNav .language .dropDownContent li:nth-of-type(2) a')
      .waitForElementVisible('#Auth h1', timeout)
      .expect.element('#Auth h1').text.to.contain('Log ind')
    client.end()
  }
}
