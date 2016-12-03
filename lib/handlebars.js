const handlebarsIntl = require('handlebars-intl')
const handlebars = require('handlebars')
const fs = require('../utils/fs')
const path = require('path')
const locales = require('../locales')
const hb = require('../utils/handlebars')
const partialsPath = path.resolve(__dirname, '..', 'templates', 'partials')

function setupRenderHb (req, res, next) {
  res.renderHb = (file, args) => {
    const locale = locales.localeFromRequest(req)
    hb
      .render(path.join('web', file),
        args,
        locale,
        locales[locale].messages)
      .then(result => res.send(result), next)
  }
  next()
}

function setup (app) {
  app.use(setupRenderHb)
  handlebarsIntl.registerWith(handlebars)
  handlebars.registerHelper('getIntlMessage', (message, {data: {intl: {messages}}}) => messages[message])
  return fs.readdir(partialsPath)
    .then(files => Promise.all(files.map(file => fs
      .readFile(path.resolve(partialsPath, file), 'utf8')
      .then(data => handlebars.registerPartial(file, handlebars.compile(data))))))
}

module.exports = setup
