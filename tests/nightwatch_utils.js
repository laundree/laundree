/**
 * Created by budde on 31/10/2016.
 */

const config = require('config')

module.exports = {
  timeout: config.get('sauceLabs.timeout')
}
