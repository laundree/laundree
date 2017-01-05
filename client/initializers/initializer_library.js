/**
 * Created by budde on 22/04/16.
 */

const Initializer = require('./initializer')

class InitializerLibrary extends Initializer {

  /**
   * @param {InitializerLibrary} initializerLibrary
   */
  constructor (initializerLibrary) {
    super(initializerLibrary)
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
