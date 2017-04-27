const fs = require('../utils/fs')
const path = require('path')
const handlebars = require('handlebars')
const templateCache = {}
const debug = require('debug')('laundree.utils.handlebars')
const locales = require('../locales')

function readTemplate (path) {
  debug('Template not cached, reading template')
  return fs
    .readFile(path, 'utf8')
    .then(source => {
      const template = handlebars.compile(source)
      templateCache[path] = template
      debug('Template read')
      return template
    })
}

function render (file, context, locale) {
  debug('Rendering template ', file)
  const p = path.resolve(__dirname, '..', '..', 'templates', file)
  const template = templateCache[p]
  const messages = locales[locale].messages
  return Promise
    .resolve(template || readTemplate(p))
    .then(template => {
      return template(Object.assign(context, {messages}))
    })
}

module.exports = {render}
