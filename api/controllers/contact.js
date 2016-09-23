/**
 * Created by budde on 23/09/16.
 */
const {api, mail: {sendEmail}} = require('../../utils')
const config = require('config')

function contact (req, res) {
  const {message, subject, email, name} = req.swagger.params.body.value
  var template, receiver, sender, userId
  const user = req.user
  if (user) {
    sender = `"${user.model.displayName}" <${user.model.email}>`
    template = 'support'
    receiver = config.get('emails.support')
    userId = user.model.id
  } else {
    if (!name) return api.returnError(res, 400, 'Name is required')
    if (!email) return api.returnError(res, 400, 'E-mail is required')
    sender = `"${name}" <${email}>`
    template = 'contact'
    receiver = config.get('emails.contact')
  }
  Promise.all([
    sendEmail({message, subject, name}, 'contact-receipt', sender),
    sendEmail({message, subject, email, name, userId}, template, receiver, sender)])
    .then(() => api.returnSuccess(res))
    .catch(api.generateErrorHandler(res))
}

module.exports = {contact}
