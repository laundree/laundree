// @flow

export function union<A> (array1: A[], array2: A[]): A[]{
  return array1.concat(array2).reduce((arr, v) => {
    if (arr.indexOf(v) >= 0) return arr
    arr.push(v)
    return arr
  }, [])
}

export function range (start: number, end?: number): number[] {
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
