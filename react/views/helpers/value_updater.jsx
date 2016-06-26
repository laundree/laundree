/**
 * Created by budde on 23/06/16.
 */

const React = require('react')

class ValueUpdater extends React.Component {

  constructor (props) {
    super(props)
    this.state = {values: {}}
  }

  generateValueUpdater (name) {
    return (evt) => {
      const value = evt.target.value
      this.setState(({values}) => {
        const obj = {}
        obj[name] = value
        return {values: Object.assign({}, values, obj)}
      })
    }
  }
}

module.exports = ValueUpdater
