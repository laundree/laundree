/**
 * Created by budde on 23/06/16.
 */

const React = require('react')

class ValueUpdater extends React.Component {
  initialValues = {}

  constructor (props) {
    super(props)
    this.state = {values: this.initialValues, sesh: 0}
  }

  reset (state = {}) {
    this.setState(({sesh}) => (Object.assign({values: this.initialValues, sesh: sesh + 1}, state)))
  }

  updateValue (values, state = {}) {
    this.setState(({values: vals}) => Object.assign({}, state, {values: Object.assign({}, vals, values)}))
  }

  generateValueMapper (name, map) {
    return () => {
      this.setState(({values}) => {
        const obj = {}
        obj[name] = map(values[name])
        return {values: Object.assign({}, values, obj)}
      })
    }
  }

  generateValueUpdater (name, map = v => v) {
    return evt => {
      const value = evt.target ? evt.target.value : evt
      this.setState(({values}) => {
        const obj = {}
        obj[name] = map(value)
        return {values: Object.assign({}, values, obj)}
      })
    }
  }

  renderNotion () {
    if (!this.state.notion) return null
    return <div className={'notion ' + (this.state.notion.success ? 'success' : 'error')}>
      {this.state.notion.message}
    </div>
  }
}

module.exports = ValueUpdater
