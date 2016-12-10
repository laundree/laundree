const handlebars = require('handlebars')
const fs = require('../utils/fs')
const path = require('path')
const hb = require('../utils/handlebars')
const partialsPath = path.resolve(__dirname, '..', 'templates', 'partials')
const debug = require('debug')('laundree.lib.handlebars')

function setupRenderHb (req, res, next) {
  res.renderHb = (file, args) => {
    const locale = req.locale
    hb
      .render(path.join('web', file),
        args,
        locale)
      .then(result => res.send(result), next)
  }
  next()
}
function format (context, options) {
  return new handlebars.SafeString(Object.keys(options.hash).reduce((message, key) => {
    const regexp = new RegExp(`{${key}}`, 'g')
    return message.replace(regexp, options.hash[key])
  }, context))
}

function setup (app) {
  app.use(setupRenderHb)
  handlebars.registerHelper({
    formatIntl: (context, options) => {
      const messages = options.hash.messages
      const message = messages[context]
      return format(message, options)
    },
    format
  })
  return fs.readdir(partialsPath)
    .then(files => Promise.all(files.map(file => fs
      .readFile(path.resolve(partialsPath, file), 'utf8')
      .then(data => {
        debug(`Registered partial ${file}`)
        return handlebars.registerPartial(file, handlebars.compile(data))
      }))))
}

module.exports = setup
