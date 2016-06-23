/**
 * Created by budde on 23/06/16.
 */

function wrapError (req) {
  var error = new Error(req.entity.message)
  error.status = req.status.code
  throw error
}

module.exports = {
  wrapError: wrapError
}
