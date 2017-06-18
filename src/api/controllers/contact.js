// @flow
import * as api from '../../utils/api'
import { sendEmail } from '../../utils/mail'
import config from 'config'

async function contactF (req, res) {
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
  await sendEmail({
    message,
    subject,
    email: senderEmail,
    name: senderName,
    userId
  }, template, receiver, {locale: req.locale})
  await sendEmail({message, subject, name: senderName}, 'contact-receipt', sender, {locale: req.locale})
  api.returnSuccess(res)
}

export const contact = api.wrapErrorHandler(contactF)
