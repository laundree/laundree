
function assignImmutable (obj, key, value) {
  const o = {}
  o[key] = value
  return Object.assign({}, obj, o)
}

module.exports = {assignImmutable}
