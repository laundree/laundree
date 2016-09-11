/**
 * Created by budde on 11/09/16.
 */

function union (array1, array2) {
  return Object.keys(array1.concat(array2).reduce((o, k) => {
    o[k] = true
    return 0
  }, {}))
}

function range (start, end) {
  if (start === undefined) throw new Error('Start not given')
  if (end === undefined) {
    end = start
    start = 0
  }
  const array = []
  for (var i = start; i < end; i++) {
    array.push(i)
  }
  return array
}

module.exports = {union, range}
