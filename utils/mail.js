/**
 * Created by budde on 07/05/16.
 */

const path = require('path')
const {EmailTemplate} = require('email-templates')
const {createTransport} = require('nodemailer')
const config = require('config')
const debug = require('debug')('laundree.utils.mail')
const locales = require('../locales')

/**
 * Render a template
 * @param {Object} data
 * @param {string} template
 * @param {string} locale
 * @return {Promise.<{html:string, text: string, subject:string}>}
 */
function render (data, template, locale) {
  debug('Rendering email')
  const messages = locales[locale].messages
  const t = new EmailTemplate(
    path.join(__dirname, '..', 'templates', 'email', template))
  return t.render(Object.assign(data, {messages}))
}

const standardTransporter = config.get('mailer.stubTransporter')
  ? createTransport(require('nodemailer-stub-transport')())
  : createTransport(config.get('mailer.smtp.transport'))

/**
 * Send email
 * @param {string} to Receiver
 * @param {{html: string, text: string, subject: string}} content
 * @param from
 * @param transporter
 * @return {Promise}
 */
function sendRenderedEmail (to, content, from, transporter) {
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
function sendEmail (data, template, to, {locale = 'en', from = config.get('emails.from'), transporter = standardTransporter} = {}) {
  debug(`Sending email to ${to}`)
  return render(data, template, locale).then((rendered) => sendRenderedEmail(to, rendered, from, transporter))
}

module.exports = {
  render,
  sendRenderedEmail,
  sendEmail
}
