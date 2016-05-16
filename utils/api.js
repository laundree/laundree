/**
 * Created by budde on 15/05/16.
 */

var config = require('config')

function generateErrorHandler (res) {
  return (err) => {
    if (config.get('logging.error.enabled')) console.log(err)
    res.statusCode = 500
    res.json({message: 'Internal server error'})
  }
}

module.exports = {generateErrorHandler: generateErrorHandler}
