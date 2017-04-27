/**
 * Created by budde on 11/09/16.
 */

function union (array1, array2) {
  return array1.concat(array2).reduce((arr, v) => {
    if (arr.indexOf(v) >= 0) return arr
    arr.push(v)
    return arr
  }, [])
}

function range (start, end) {
  if (start === undefined) throw new Error('Start not given')
  if (end === undefined) {
    end = start
    start = 0
  }
  const array = []
  for (let i = start; i < end; i++) {
    array.push(i)
  }
  return array
}

module.exports = {union, range}
