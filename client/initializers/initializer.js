/**
 * Created by budde on 22/04/16.
 */

class Initializer {

  /**
   * @param {InitializerLibrary} init_library
   */
  constructor (init_library) {
    this.init_library = init_library
  }

  /**
   * @param {Element|Document} element
   */
  setup (element) {
    throw new Error('Not yet implemented.')
  }

}

module.exports = Initializer
