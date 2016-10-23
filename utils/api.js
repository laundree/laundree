/**
 * Created by budde on 15/05/16.
 */

const error = require('./error')

function generateErrorHandler (res) {
  return (err) => {
    error.logError(err)
    res.statusCode = 500
    res.json({message: 'Internal server error'})
  }
}
/**
 * Return an error.
 * @param res
 * @param {number} statusCode
 * @param {string} message
 * @param {Object=} headers
 */
function returnError (res, statusCode, message, headers = {}) {
  res.statusCode = statusCode
  Object.keys(headers).forEach((header) => res.set(header, headers[header]))
  res.json({message: message})
}
/**
 * Return success
 * @param res
 * @param {(Promise|Object)=} result
 * @returns {number|*}
 */
function returnSuccess (res, result) {
  res.statusCode = result ? 200 : 204
  if (!result) return res.end()
  Promise.resolve(result)
    .then(result => res.json(result))
    .catch(error.logError)
}

module.exports = {
  generateErrorHandler: generateErrorHandler,
  returnError: returnError,
  returnSuccess: returnSuccess
}
