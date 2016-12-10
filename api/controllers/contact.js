/**
 * Created by budde on 23/09/16.
 */
const {api, mail: {sendEmail}} = require('../../utils')
const config = require('config')

function contact (req, res) {
  const {message, subject, email, name} = req.swagger.params.body.value
  let template, receiver, sender, userId, senderEmail, senderName
  const user = req.user
  if (user) {
    senderEmail = user.model.emails[0]
    senderName = user.model.displayName
    sender = `"${user.model.displayName}" <${senderEmail}>`
    template = 'support'
    receiver = config.get('emails.support')
    userId = user.model.id
  } else {
    if (!name) return api.returnError(res, 400, 'Name is required')
    if (!email) return api.returnError(res, 400, 'E-mail is required')
    senderName = name
    senderEmail = email
    sender = `"${name}" <${email}>`
    template = 'contact'
    receiver = config.get('emails.contact')
  }
  sendEmail({message, subject, email: senderEmail, name: senderName, userId}, template, receiver, {locale: req.locale})
    .then(() => sendEmail({message, subject, name}, 'contact-receipt', sender, {locale: req.locale}))
    .then(() => api.returnSuccess(res))
    .catch(api.generateErrorHandler(res))
}

module.exports = {contact}
