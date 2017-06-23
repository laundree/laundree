// @flow

import path from 'path'
import { EmailTemplate } from 'email-templates'
import { createTransport } from 'nodemailer'
import config from 'config'
import Debug from 'debug'
import { locales } from '../locales'
import type { LocaleType } from '../locales'
import nodeMailerStub from 'nodemailer-stub-transport'

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

const standardTransporter: Transporter = config.get('mailer.stubTransporter')
  ? createTransport(nodeMailerStub())
  : createTransport(config.get('mailer.smtp.transport'))

/**
 * Send email
 * @param {string} to Receiver
 * @param {{html: string, text: string, subject: string}} content
 * @param from
 * @param transporter
 * @return {Promise}
 */
export function sendRenderedEmail (to: string, content: MailContent, from: string, transporter: Transporter) {
  const options = {
    from,
    to,
    subject: content.subject,
    text: content.text,
    html: content.html
  }
  return new Promise((resolve, reject) => {
    debug('Sending mail')
    debug(options)
    if (config.get('mailer.dryRun')) return resolve()
    transporter.sendMail(options, (err, info) => {
      if (err) return reject(err)
      resolve(info)
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
 * @param transporter=
 * @returns {Promise}
 */
export function sendEmail (data: Object, template: string, to: string, {locale = 'en', from = config.get('emails.from'), transporter = standardTransporter}: { locale?: LocaleType, from?: string, transporter?: Transporter } = {}) {
  debug(`Sending email to ${to}`)
  return render(data, template, locale).then((rendered) => sendRenderedEmail(to, rendered, from, transporter))
}
