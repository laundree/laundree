/**
 * Created by budde on 22/04/16.
 */

class Initializer {

  /**
   * @param {InitializerLibrary} initializerLibrary
   */
  constructor (initializerLibrary) {
    this.init_library = initializerLibrary
  }

  /**
   * @param {Element|Document} element
   */
  setup (element) {
    throw new Error('Not yet implemented.')
  }

}

module.exports = Initializer
