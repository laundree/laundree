// @flow

import path from 'path'
import { EmailTemplate } from 'email-templates'
import config from 'config'
import Debug from 'debug'
import { locales } from '../locales'
import type { LocaleType } from '../locales'
import { Mailgun } from 'mailgun'
import MailComposer from 'nodemailer/lib/mail-composer'

const mg = new Mailgun(config.get('mailgun.apiKey'))
const debug = Debug('laundree.utils.mail')

type MailContent = { html: string, text: string, subject: string }

/**
 * Render a template
 * @param {Object} data
 * @param {string} template
 * @param {string} locale
 * @return {Promise.<{html:string, text: string, subject:string}>}
 */
export function render (data: Object, template: string, locale: LocaleType): Promise<MailContent> {
  debug('Rendering email')
  const messages = locales[locale]
  const t = new EmailTemplate(
    path.join(__dirname, '..', '..', 'templates', 'email', template))
  return t.render({...data, messages})
}

type TransporterOptions = { from: string, to: string } & MailContent

type Transporter = { sendMail: (options: TransporterOptions, callback: (err: ?Error, data: ?Object) => void) => void }

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
    html: content.html
  }
  const mail = new MailComposer(options)
  try {
    return await new Promise((resolve, reject) => {
      debug('Sending mail', to, from)
      debug(options)
      mail.compile().build((err, msg) => {
        if (err) {
          return reject(err)
        }
        if (!config.get('mailgun.enabled')) {
          debug('Mailgun is not enabled. Skipping.')
          return resolve(msg)
        }
        mg.sendRaw(from, to, msg, (err) => {
          if (err) {
            return reject(err)
          }
          resolve(msg)
        })
      })
    })
  } catch (err) {
    debug('Failed with error', err)
    throw err
  }
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
export async function sendEmail (data: Object, template: string, to: string, {locale = 'en', from = config.get('emails.from')}: { locale?: LocaleType, from?: string, transporter?: Transporter } = {}) {
  debug(`Sending email to ${to}`)
  const rendered = await render(data, template, locale)
  return sendRenderedEmail(to, rendered, from)
}
