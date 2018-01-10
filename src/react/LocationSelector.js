// @flow
import React from 'react'
import ValueUpdater from './helpers/ValueUpdater'
import { createClient } from '@google/maps'
import { Input } from './intl'
import { FormattedMessage } from 'react-intl'
import type { LocaleType } from '../locales/index'
import { connect } from 'react-redux'
import type { StateAddendum } from './types'

function resultsToFormattedAddressLookup (results) {
  return results.reduce((o, {place_id: placeId, formatted_address: formattedAddress}) => {
    o[placeId] = formattedAddress
    return o
  }, {})
}

type LocationSelectorState = {
  latestCompletedLookupNo?: number,
  latestLookupNo?: number,
  results: string[],
  formattedAddresses: { [string]: string },
  focus: boolean
}

type LocationSelectorProps = {
  googleApiKey: string,
  locale: LocaleType,
  onChange: (s: string) => void,
  value: string
}

type LocationSelectorValues = {
  address: string
}

class LocationSelector extends ValueUpdater<LocationSelectorValues, LocationSelectorProps, LocationSelectorState> {
  initialState () {
    return {results: [], formattedAddresses: {}, focus: false}
  }

  lookupNo = 0
  googleMapsClient = null
  lastLookup: number
  fetching: ?string

  initialValues () {
    return {address: ''}
  }

  componentDidMount () {
    this.googleMapsClient = createClient({key: this.props.googleApiKey})
    this.fetchFormattedAddress(this.props.value)
  }

  handleAddressChange (event: Event) {
    const lookupNo = this.lookupNo++
    const value = (event.target && typeof event.target.value === 'string' && event.target.value) || ''
    clearTimeout(this.lastLookup)
    let state: $Shape<LocationSelectorState> = {results: [], latestLookupNo: lookupNo}
    if (value.trim()) {
      this.lastLookup = setTimeout(() => this.lookup(value, lookupNo), 500)
    } else {
      this.setState({latestCompletedLookupNo: lookupNo})
    }
    this.updateValue({address: value}, state)
    this.props.onChange('')
  }

  lookup (address: string, lookupNo: number) {
    if (!this.googleMapsClient) {
      throw new Error('Google maps client not created')
    }
    this.googleMapsClient.geocode({address, language: this.props.locale}, (err, response) => {
      if (err) return
      const {json, status} = response
      if (status !== 200) return
      this.setState(({formattedAddresses}) => ({
        latestCompletedLookupNo: lookupNo,
        results: json.results.map(({place_id: placeId}) => placeId),
        formattedAddresses: Object.assign({}, formattedAddresses, resultsToFormattedAddressLookup(json.results))
      }))
    })
  }

  componentWillReceiveProps ({value}: LocationSelectorProps) {
    this.fetchFormattedAddress(value)
  }

  fetchFormattedAddress (placeId: string) {
    if (!this.googleMapsClient) {
      throw new Error('Google maps client is not initialized')
    }
    if (!placeId) return
    const cachedAddress = this.state.formattedAddresses[placeId]
    if (cachedAddress) {
      this.updateValue({address: cachedAddress})
      return
    }
    if (this.fetching === placeId) return
    this.fetching = placeId
    const startLookupNo = this.state.latestLookupNo
    this.googleMapsClient.reverseGeocode({place_id: placeId, language: this.props.locale}, (err, response) => {
      if (err || response.status !== 200 || response.json.results.length === 0) return
      if (startLookupNo !== this.state.latestLookupNo) return
      const newFormatted = resultsToFormattedAddressLookup(response.json.results)
      const result = response.json.results[0]
      this.setState(({values, formattedAddresses}) => ({
        results: [result.place_id],
        values: Object.assign({}, values, {address: result.formatted_address}),
        formattedAddresses: Object.assign({}, formattedAddresses, newFormatted)
      }))
    })
  }

  updatePlace (placeId: string) {
    this.props.onChange(placeId)
  }

  renderDropDownContent () {
    if (this.state.results.length) {
      return <ul className='dropDownList'>
        {this.state.results
          .map(result => <li key={result} className={this.props.value === result ? 'active' : ''}>
              <span
                className='link'
                onMouseDown={() => this.updatePlace(result)}>
                  {this.state.formattedAddresses[result]}
                </span>
          </li>)}
      </ul>
    }
    return <div className='dropDownMessage'>
      <FormattedMessage id={this.message()} />
    </div>
  }

  message () {
    if (this.state.latestCompletedLookupNo !== this.state.latestLookupNo) {
      return 'location-selector.drop-down.loading'
    }
    if (!this.state.values.address) {
      return 'location-selector.drop-down.empty'
    }
    return 'location-selector.drop-down.no-results'
  }

  render () {
    return <div
      className={`locationSelector dropDown ${this.state.focus ? 'open' : ''}`}
      onBlur={() => this.setState({focus: false})}
      onFocus={() => this.setState({focus: true})}>
      <Input
        type='text' value={this.state.values.address} onChange={evt => this.handleAddressChange(evt)}
        placeholder={!this.state.values.address && this.props.value ? 'location-selector.loading-placeholder' : 'general.address'} />
      <div className='dropDownContent'>
        {this.renderDropDownContent()}
      </div>
    </div>
  }
}

export default connect(({config: {locale, googleApiKey}}: StateAddendum): { locale: LocaleType, googleApiKey: string } => ({
  locale, googleApiKey
}))(LocationSelector)
