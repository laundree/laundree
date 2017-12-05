// @flow

import path from 'path'
import config from 'config'
import Debug from 'debug'
import type { LocaleType } from '../locales'
import Mailgun from 'mailgun-js'
import MailComposer from 'nodemailer/lib/mail-composer'
import { setupHandlebarsHelpers, render as renderHb } from '../utils/handlebars'

setupHandlebarsHelpers()
const mailgun = Mailgun(config.get('mailgun'))
const debug = Debug('laundree.utils.mail')

type MailContent = { html: string, text: string, subject: string }

/**
 * Render a template
 * @param {Object} data
 * @param {string} template
 * @param {string} locale
 * @return {Promise.<{html:string, text: string, subject:string}>}
 */
export async function render (data: Object, template: string, locale: LocaleType): Promise<MailContent> {
  debug('Rendering email')
  const htmlP = renderHb(path.join('email', template, 'html.hbs'), data, locale)
  const textP = renderHb(path.join('email', template, 'text.hbs'), data, locale)
  const subjectP = renderHb(path.join('email', template, 'subject.hbs'), data, locale)
  return {
    html: await htmlP,
    text: await textP,
    subject: await subjectP
  }
}

/**
 * Send email
 * @param {string} to Receiver
 * @param {{html: string, text: string, subject: string}} content
 * @param from
 * @return {Promise}
 */
export async function sendRenderedEmail (to: string, content: MailContent, from: string) {
  const options = {
    subject: content.subject,
    text: content.text,
    html: content.html,
    from,
    to
  }
  try {
    debug('Sending mail', to, from)
    debug(options)
    const message = await compileMessage(options)
    if (!config.get('mailgun.enabled')) {
      debug('Mailgun is not enabled. Skipping.')
      return message
    }
    await sendMailgunMail(to, message)
    return message
  } catch (err) {
    debug('Failed with error', err)
    throw err
  }
}

function compileMessage (data) {
  const mail = new MailComposer(data)
  return new Promise((resolve, reject) => {
    mail.compile().build((err, msg) => {
      if (err) {
        return reject(err)
      }
      resolve(msg)
    })
  })
}

function sendMailgunMail (to, message) {
  return new Promise((resolve, reject) => {
    mailgun.messages().sendMime({to, message: message.toString('ascii')}, (err, data) => {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
}

/**
 * Render and send an email.
 * @param {Object} data
 * @param {string} template
 * @param {string} to
 * @param from=
 * @param {string=} locale
 * @returns {Promise}
 */
export async function sendEmail (data: Object, template: string, to: string, {locale = 'en', from = config.get('emails.from')}: { locale?: LocaleType, from?: string } = {}) {
  debug(`Sending email to ${to}`)
  const rendered = await render(data, template, locale)
  return sendRenderedEmail(to, rendered, from)
}
