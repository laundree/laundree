// @flow
import {readFile} from '../utils/fs'
import path from 'path'
import handlebars from 'handlebars'
import Debug from 'debug'
import {locales} from '../locales'
import type { LocaleType } from '../locales'
const debug = Debug('laundree.utils.handlebars')
const templateCache = {}

function readTemplate (path) {
  debug('Template not cached, reading template')
  return readFile(path)
    .then(source => {
      const template = handlebars.compile(source)
      templateCache[path] = template
      debug('Template read')
      return template
    })
}

export function render (file: string, context: Object, locale: LocaleType) {
  debug('Rendering template ', file)
  const p = path.resolve(__dirname, '..', '..', 'templates', file)
  const template = templateCache[p]
  const messages = locales[locale]
  return Promise
    .resolve(template || readTemplate(p))
    .then(template => {
      return template(Object.assign(context, {messages}))
    })
}
