// @flow
import { readFile } from '../utils/fs'
import path from 'path'
import handlebars from 'handlebars'
import Debug from 'debug'
import { locales } from '../locales'
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

export async function render (file: string, context: Object, locale: LocaleType) {
  debug('Rendering template ', file)
  const p = path.resolve(__dirname, '..', '..', 'templates', file)
  const cachedTemplate = templateCache[p]
  const messages = locales[locale]
  const template = cachedTemplate || await readTemplate(p)
  return template(Object.assign(context, {messages}))
}

function format (context, options) {
  return new handlebars.SafeString(Object.keys(options.hash).reduce((message, key) => {
    const regexp = new RegExp(`{${key}}`, 'g')
    return message.replace(regexp, options.hash[key])
  }, context))
}

function formatIntl (context, options) {
  const messages = options.hash.messages
  const message = messages[context]
  return format(message, options)
}

let handlebarsSetup = false

export function setupHandlebarsHelpers () {
  if (handlebarsSetup) return
  handlebarsSetup = true
  handlebars.registerHelper({
    formatIntl,
    format
  })
}
