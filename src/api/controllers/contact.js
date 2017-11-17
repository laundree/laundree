// @flow
import * as api from '../helper'
import { sendEmail } from '../../utils/mail'
import config from 'config'

async function contactF (_, params) {
  const {contactBody} = api.assertSubjects({contactBody: params.contactBody})
  const {message, subject, email, name, locale} = contactBody
  const senderName = name
  const senderEmail = email
  const sender = `"${name}" <${email}>`
  const template = 'contact'
  const receiver = config.get('emails.contact')
  await sendEmail({
    message,
    subject,
    email: senderEmail,
    name: senderName
  }, template, receiver, {locale: locale || 'en'})
  await sendEmail({message, subject, name: senderName}, 'contact-receipt', sender, {locale: locale || 'en'})
}

async function contactSupportF (subjects, params) {
  const {currentUser, contactSupportBody} = api.assertSubjects({
    currentUser: subjects.currentUser,
    contactSupportBody: params.contactSupportBody
  })
  const {message, subject, locale} = contactSupportBody
  const senderEmail = currentUser.model.emails[0]
  const senderName = currentUser.model.displayName
  const sender = `"${currentUser.model.displayName}" <${senderEmail}>`
  const template = 'support'
  const receiver = config.get('emails.support')
  const userId = currentUser.model.id
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
export const contactSupport = api.wrap(contactSupportF, api.securityNoop)
