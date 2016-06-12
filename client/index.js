/**
 * Created by budde on 12/04/16.
 */

console.log('┬┴┬┴┤ ͜ʖ ͡°) ├┬┴┬┴')

var initializers = require('./initializers')

var library = new initializers.InitializerLibrary()
library.registerInitializer(initializers.AppInitializer)

library.setup()
