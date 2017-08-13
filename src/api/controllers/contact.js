// @flow
import * as api from '../helper'
import { sendEmail } from '../../utils/mail'
import config from 'config'
import { StatusError } from '../../utils/error'

async function contactF ({currentUser}, params) {
  const {contactBody} = api.assertSubjects({contactBody: params.contactBody})
  const {message, subject, email, name, locale} = contactBody
  let template, receiver, sender, userId, senderEmail, senderName
  if (currentUser) {
    senderEmail = currentUser.model.emails[0]
    senderName = currentUser.model.displayName
    sender = `"${currentUser.model.displayName}" <${senderEmail}>`
    template = 'support'
    receiver = config.get('emails.support')
    userId = currentUser.model.id
  } else {
    if (!name) {
      throw new StatusError('Name is required', 400)
    }
    if (!email) {
      throw new StatusError('E-mail is required', 400)
    }
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
  }, template, receiver, {locale: locale || 'en'})
  await sendEmail({message, subject, name: senderName}, 'contact-receipt', sender, {locale: locale || 'en'})
}

export const contact = api.wrap(contactF, api.securityNoop)
