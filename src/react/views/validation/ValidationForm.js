// @flow

import React from 'react'
import type { Children } from 'react'
import PropTypes from 'prop-types'

type ValidationFormProps = {
  sesh: number,
  initial: bool,
  onSubmit: Function,
  className: string,
  id: string,
  method: string,
  action: string,
  children: Children
}

export default class ValidationForm extends React.Component {
  initialState = {initial: true, failed: false, valid: {}}
  state = this.initialState
  submitHandler = (evt: Event) => {
    if (!this.valid()) {
      evt.preventDefault()
      this.setState({failed: true})
      return
    }
    if (!this.props.onSubmit) return
    this.props.onSubmit(evt)
  }

  componentWillReceiveProps ({sesh}: ValidationFormProps) {
    if (sesh === this.props.sesh) return
    this.setState(this.initialState)
  }

  generateValidationHandler () {
    return (name: string, valid: boolean, initial: boolean) => {
      this.setState((prevState) => {
        const valids = prevState.valid
        const obj = {}
        obj[name] = valid
        const resultObj = {valid: Object.assign({}, valids, obj)}
        if (initial) return Object.assign({}, resultObj)
        return {...{initial: false}, ...resultObj}
      })
    }
  }

  valid () {
    const valids = this.state.valid
    return Object
      .keys(valids)
      .map((k) => valids[k])
      .every((v) => v)
  }

  initial () {
    return this.props.initial || this.state.initial
  }

  failed () {
    return this.state.failed
  }

  getChildContext () {
    return {validation: {handler: this.generateValidationHandler()}}
  }

  className () {
    return (this.props.className || '') +
      (this.valid() ? '' : ' invalid') +
      (this.initial() ? ' initial' : '') +
      (this.failed() ? ' failed' : '')
  }

  render () {
    return <form
      onSubmit={this.submitHandler}
      id={this.props.id}
      action={this.props.action}
      method={this.props.method}
      className={this.className()}>
      {this.props.children}
    </form>
  }
}

ValidationForm.childContextTypes = {
  validation: PropTypes.shape({handler: PropTypes.func})
}
