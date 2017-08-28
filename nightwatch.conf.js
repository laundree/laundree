/**
 * Created by budde on 31/10/2016.
 */

module.exports = {
  'src_folders': [
    'test/e2e/laundry/user.tests.js'
  ],
  'output_folder': 'reports',
  'custom_commands_path': '',
  'custom_assertions_path': '',
  'page_objects_path': '',
  'selenium': {
    'start_process': false,
    'server_path': './selenium-bin/selenium.jar',
    'log_path': 'log',
    'port': 4444,
    'cli_args': {
      'webdriver.chrome.driver': './selenium-bin/chromedriver'
    }
  },
  'test_settings': {
    'default': {
      'launch_url': process.env.NIGHTWATCH_LAUNCH_URL || 'http://localhost:3000/',
      'selenium_port': process.env.SELENIUM_PORT || 4444,
      'selenium_host': process.env.SELENIUM_HOST || 'localhost',
      'silent': true,
      'screenshots': {
        'enabled': false,
        'path': ''
      },
      'desiredCapabilities': {
        'browserName': 'chrome',
        'chromeOptions': {
          'args': [
            '--no-sandbox'
          ]
        }
      }
    }
  }
}
