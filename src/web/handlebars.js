// @flow

import handlebars from 'handlebars'
import * as fs from '../utils/fs'
import path from 'path'
import * as hb from '../utils/handlebars'
import Debug from 'debug'
import { toLocale } from '../locales/index'
import type {Request, Application} from './types'

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

export default function setup (app: Application) {
  app.use(setupRenderHb)
  hb.setupHandlebarsHelpers()
  return fs.readdir(partialsPath)
    .then(files => Promise.all(files.map(file => fs
      .readFile(path.resolve(partialsPath, file))
      .then(data => {
        debug(`Registered partial ${file}`)
        return handlebars.registerPartial(file, handlebars.compile(data))
      }))))
}
