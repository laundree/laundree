// @flow

import handlebars from 'handlebars'
import * as fs from '../utils/fs'
import path from 'path'
import * as hb from '../utils/handlebars'
import Debug from 'debug'
import { toLocale } from '../locales'
import type {Request, Application} from '../types'

const debug = Debug('laundree.lib.handlebars')

const partialsPath = path.resolve(__dirname, '..', '..', 'templates', 'partials')

function setupRenderHb (req: Request, res, next) {
  res.renderHb = (file: string, args) => {
    const locale = toLocale(req.locale || '', 'en')
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

export default function setup (app: Application) {
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
