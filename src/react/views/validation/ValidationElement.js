// @flow
import React from 'react'
import * as regex from '../../../utils/regex'
import PropTypes from 'prop-types'

let id = 0

function newId () {
  return id++
}

export type ValidationElementProps<V> = {
  sesh?: number,
  equal?: V,
  not?: V,
  value: V,
  validator?: (v: V) => *,
  children?: *,
  notOneOf?: string[],
  oneOf?: string[],
  nonEmpty?: boolean,
  email?: boolean,
  password?: boolean
}

export default class ValidationElement<V> extends React.Component<ValidationElementProps<V>, { initial: boolean }> {
  initialState = {initial: true}
  state = {initial: true}
  id: number

  handle (valid: boolean, initial: boolean = false) {
    this.context.validation.handler(this.name(), valid, initial)
  }

  componentDidMount () {
    this.id = newId()
    this.reset()
  }

  reset () {
    this.setState(this.initialState)
    this.handle(this.validate(), true)
  }

  componentWillReceiveProps (props: ValidationElementProps<V>) {
    const {sesh} = props
    const initial = sesh !== this.props.sesh
    if (initial) {
      this.setState({initial})
      return this.handle(this.validate(props), initial)
    }
    if (props.value === this.props.value && Boolean(this.validate(props)) === Boolean(this.validate(this.props))) return
    this.handle(this.validate(props), initial)
  }

  name () {
    return `id${this.id}`
  }

  validate (props: ValidationElementProps<V> = this.props): boolean {
    const value = props.trim && typeof props.value === 'string'
      ? props.value.trim()
      : props.value
    if (props.equal !== undefined) return props.equal === value
    if (props.not !== undefined) return props.not !== value
    if (props.validator) return Boolean(props.validator(value))
    if (typeof value === 'string') {
      if (props.notOneOf) return props.notOneOf.indexOf(value) < 0
      if (props.oneOf) return props.oneOf.indexOf(value) >= 0
      if (props.nonEmpty) return Boolean(value)
      if (props.email) return regex.email.exec(value)
      if (props.password) return regex.password.exec(value)
    }
    return true
  }

  render () {
    const valid = this.validate()
    if (!this.props.children) return null
    const child = React.Children.only(this.props.children)
    return React.cloneElement(child, {
      className: (child.props.className || '') + (valid ? '' : ' invalid') +
      (this.state.initial ? ' initial' : '')
    })
  }
}

ValidationElement.contextTypes = {
  validation: PropTypes.shape({handler: PropTypes.func})
}
