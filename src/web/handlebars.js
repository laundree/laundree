// @flow

import handlebars from 'handlebars'
import * as fs from '../utils/fs'
import path from 'path'
import * as hb from '../utils/handlebars'
import Debug from 'debug'
import { toLocale } from '../locales/index'
import type {Request, WebApp} from './types'

const debug = Debug('laundree.lib.handlebars')

const partialsPath = path.resolve(__dirname, '..', '..', 'templates', 'partials')

function setupRenderHb (req: Request, res, next) {
  res.renderHb = async (file: string, args) => {
    try {
      const locale = toLocale(req.locale || '', 'en')
      const result = await hb
        .render(path.join('web', file),
          args,
          locale)
      res.send(result)
    } catch (err) {
      next(err)
    }
  }
  next()
}

async function registerPartial (file) {
  const data = await fs.readFile(path.resolve(partialsPath, file))
  debug(`Registered partial ${file}`)
  return handlebars.registerPartial(file, handlebars.compile(data))
}

export default async function setup (app: WebApp) {
  app.use(setupRenderHb)
  hb.setupHandlebarsHelpers()
  const files = await fs.readdir(partialsPath)
  await Promise.all(files.map(registerPartial))
}
