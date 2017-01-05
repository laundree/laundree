/**
 * Created by budde on 12/04/16.
 */

const debug = require('debug')('laundree.client')

debug('┬┴┬┴┤ ͜ʖ ͡°) ├┬┴┬┴')

const initializers = require('./initializers')

const library = new initializers.InitializerLibrary()
library.registerInitializer(initializers.AppInitializer)

library.setup()

module.exports = {sdk: require('./sdk')}
