const fs = require('../utils/fs')
const path = require('path')
const handlebars = require('handlebars')
const templateCache = {}
const debug = require('debug')('laundree.utils.handlebars')

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

function render (file, context, locale, messages) {
  debug('Rendering template ', file)
  const p = path.resolve(__dirname, '..', 'templates', file)
  const template = templateCache[p]
  return Promise
    .resolve(template || readTemplate(p))
    .then(template => {
      const intlData = {locales: locale, messages}
      return template(context, {data: {intl: intlData}})
    })
}

module.exports = {render}
