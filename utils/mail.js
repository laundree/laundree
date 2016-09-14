/**
 * Created by budde on 07/05/16.
 */
const Promise = require('promise')
const path = require('path')
const EmailTemplate = require('email-templates').EmailTemplate
const {createTransport} = require('nodemailer')
const config = require('config')
const debug = require('debug')('laundree.utils.mail')
/**
 * Render a template
 * @param {Object} data
 * @param {string} template
 * @return {Promise.<{html:string, text: string, subject:string}>}
 */
function render (data, template) {
  var t = new EmailTemplate(path.join(__dirname, '..', 'email-templates', template))
  return t.render(data)
}

var standardTransporter = config.get('mailer.stubTransporter')
  ? createTransport(require('nodemailer-stub-transport')())
  : createTransport(config.get('mailer.smtp.transport'))

/**
 * Send email
 * @param {string} address Receiver
 * @param {{html: string, text: string, subject: string}} content
 * @param transporter=
 * @return {Promise}
 */
function sendRenderedEmail (address, content, transporter = standardTransporter) {
  var options = {
    from: '"Laundree.io" <no-reply@laundree.io>',
    to: address,
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
 * @param {string} address
 * @param transporter=
 */
function sendEmail (data, template, address, transporter) {
  return render(data, template).then((rendered) => sendRenderedEmail(address, rendered, transporter))
}

module.exports = {
  render: render,
  sendRenderedEmail: sendRenderedEmail,
  sendEmail: sendEmail
}
