const en = require('./en.json')
const da = Object.assign({}, en, require('./da.json'))
const daLocale = require('react-intl/locale-data/da')
const enLocale = require('react-intl/locale-data/en')
const {addLocaleData} = require('react-intl')

addLocaleData(daLocale.concat(enLocale))

module.exports = {
  en: {name: 'English', messages: en},
  da: {name: 'Dansk', messages: da}
}
