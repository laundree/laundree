/**
 * Created by budde on 04/05/16.
 */
var Initializer = require('./initializer')

var elements = []

var listener = (target) => {
  while (target && target.classList) {
    if (target.classList.contains('dropdown')) return
    target = target.parentNode
  }
  elements.forEach((element) => element.classList.remove('open'))
}

document.addEventListener('click', (event) => listener(event.target))
document.addEventListener('keyup', (event) => {
  if (event.keyCode !== 27) return
  listener(event.target)
})

function setupDropDown (element) {
  var content = element.querySelector('.dropdown-content')
  if (!content) return
  elements.push(element)
  element.addEventListener('click', (event) => {
    var target = event.target
    while (target) {
      if (target === content) return
      target = target.parentNode
    }
    elements
      .filter((elm) => elm !== element)
      .filter((element) => element.classList.contains('open'))
      .forEach((element) => element.classList.remove('open'))
    element.classList.toggle('open')
  })
}

class DropDownInitializer extends Initializer {

  setup (element) {
    var dropDowns = element.querySelectorAll('.dropdown')
    for (var i = 0; i < dropDowns.length; i++) {
      setupDropDown(dropDowns[i])
    }
  }

}

module.exports = DropDownInitializer
