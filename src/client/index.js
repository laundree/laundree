// @flow

import s from './sdk'
import Debug from 'debug'
const debug = Debug('laundree.client')

debug('┬┴┬┴┤ ͜ʖ ͡°) ├┬┴┬┴')

const initializers = require('./initializers')

const library = new initializers.InitializerLibrary()
library.registerInitializer(initializers.AppInitializer)

library.setup()

export const sdk = s
