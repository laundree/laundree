/**
 * Created by budde on 07/05/16.
 */
const Promise = require('promise')
var path = require('path')
var EmailTemplate = require('email-templates').EmailTemplate
var nodemailer = require('nodemailer')
var config = require('config')
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

var standardTransporter = nodemailer.createTransport(config.get('mailer.smtp.transport'))

/**
 * Send email
 * @param {string} address Receiver
 * @param {{html: string, text: string, subject: string}} content
 * @return {Promise}
 */
function sendRenderedEmail (address, content) {
  var transporter = module.exports.transporter || standardTransporter
  var options = {
    from: '"Laundree.io" <no-reply@laundree.io>',
    to: address,
    subject: content.subject,
    text: content.text,
    html: content.html
  }
  return new Promise((resolve, reject) => {
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
 */
function sendEmail (data, template, address) {
  return render(data, template).then((rendered) => sendRenderedEmail(address, rendered))
}

module.exports = {
  render: render,
  sendRenderedEmail: sendRenderedEmail,
  sendEmail: sendEmail
}
