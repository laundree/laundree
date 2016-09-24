/**
 * Returns corresponding short name
 * @param {string} name
 */
function shortName (name) {
  return name.toLocaleLowerCase().trim().match(/(^(.)| ([^\s])|[0-9])/g).map((m) => m.trim()).join('').toLocaleUpperCase()
}

module.exports = {
  shortName
}
