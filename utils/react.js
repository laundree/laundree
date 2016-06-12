/**
 * Created by budde on 12/06/16.
 */

function generateChangeHandler (self, name) {
  return (evt) => {
    const value = evt.target.value
    self.setState((prevState) => {
      const obj = {}
      obj[name] = value
      return {values: Object.assign({}, prevState.values, obj)}
    })
  }
}

module.exports = {
  generateChangeHandler: generateChangeHandler
}
