/**
 * Created by budde on 22/05/16.
 */

var Initializer = require('./initializer')

class MenuExpanderInitializer extends Initializer {

  setup (element) {
    var expander = element.querySelector('#MenuExpander')
    if (!expander) return
    expander.addEventListener('click', () => document.body.classList.toggle('expanded_left_nav'))
  }
}

module.exports = MenuExpanderInitializer
