const {escape, unescape} = require('base64-url')

function hexToBase64Url (hexString) {
  return escape(new Buffer(hexString, 'hex').toString('base64'))
}

function base64UrlToHex (base64UrlString) {
  return new Buffer(unescape(base64UrlString), 'base64').toString('hex')
}

module.exports = {
  hexToBase64Url, base64UrlToHex
}
