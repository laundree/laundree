// @flow

import React from 'react'

type Notion = { success: boolean, message: string | React$Element<*> }

export default class ValueUpdater<V: {}, Props, State: {}> extends React.Component<void, Props, State & { values: V, sesh: number, notion: ?Notion }> {
  state: State & { values: V, sesh: number, notion: ?Notion } = {
    ...this.initialState(),
    values: this.initialValues(),
    sesh: 0,
    notion: null
  }

  initialState (): State {
    throw new Error('Not implemented!')
  }

  initialValues (): V {
    throw new Error('Not implemented!')
  }

  reset (state: $Shape<State & { values: V, sesh: number, notion: ?Notion }> = {}) {
    this.setState(({sesh}) => ({...state, values: this.initialValues(), sesh: sesh + 1}))
  }

  updateValue (values: $Shape<V>, state: $Supertype<State> = {}) {
    this.setState(({values: vals}) => ({...state, values: {...vals, values}}))
  }

  generateValueEventUpdater (m: (string, V) => $Shape<V>) {
    return (evt: Event) => {
      if (!evt.target || typeof evt.target.value !== 'string') {
        throw new Error('Could not fetch value')
      }
      const value = evt.target.value
      this.setState(({values}) => {
        const newValues: $Shape<V> = m(value, values)
        return {values: {...values, ...newValues}}
      })
    }
  }

  generateValueUpdater<X> (map: (X, V) => $Shape<V>): (X) => void {
    return (evt: X) => {
      this.setState(({values}) => {
        const newValues: $Shape<V> = map(evt, values)
        return {values: {...values, ...newValues}}
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

