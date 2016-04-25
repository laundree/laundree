/**
 * Created by budde on 22/04/16.
 */

var Initializer = require('./initializer')

class InitializerLibrary extends Initializer {

  constructor (init_library) {
    super(init_library)
    this.initializers = []
  }

  setup (element) {
    element = element || document
    this.initializers.forEach((i) => i.setup(element))
  }

  /**
   * @param {Function} Initializer
   */
  registerInitializer (Initializer) {
    this.initializers.push(new Initializer(this))
  }

}

module.exports = InitializerLibrary