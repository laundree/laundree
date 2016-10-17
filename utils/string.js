const crypto = require('crypto')

/**
 * Returns corresponding short name
 * @param {string} name
 */
function shortName (name) {
  return name.toLocaleLowerCase().trim().match(/(^(.)| ([^\s])|[0-9])/g).map((m) => m.trim()).join('').toLocaleUpperCase()
}

function hash (str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

module.exports = {
  shortName, hash
}
